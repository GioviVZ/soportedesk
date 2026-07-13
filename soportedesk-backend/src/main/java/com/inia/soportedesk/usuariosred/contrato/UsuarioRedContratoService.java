package com.inia.soportedesk.usuariosred.contrato;

import com.inia.soportedesk.activedirectory.AdUsuarioCache;
import com.inia.soportedesk.activedirectory.AdUsuarioCacheRepository;
import com.inia.soportedesk.activedirectory.ActiveDirectoryService;
import com.inia.soportedesk.catalogo.TipoContrato;
import com.inia.soportedesk.catalogo.TipoContratoRepository;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Comparator;
import java.util.Objects;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UsuarioRedContratoService {

    private static final int CONSULTA_LIMIT = 1000;
    private static final int CANDIDATE_LIMIT = 1000;
    private static final Set<String> ACRONYM_STOPWORDS = Set.of("de", "del", "la", "las", "los", "el", "y", "e", "en");

    private final UsuarioRedContratoRepository repository;
    private final TipoContratoRepository tipoContratoRepository;
    private final AdUsuarioCacheRepository adUsuarioCacheRepository;
    private final ActiveDirectoryService activeDirectoryService;

    public List<UsuarioRedContratoDto> findByUsuario(String usuario) {
        return repository.findByUsuarioIgnoreCaseOrderByFechaInicioDesc(usuario)
                .stream()
                .map(this::toDto)
                .toList();
    }

    public List<UsuarioRedContratoDto> searchByPersonal(String term) {
        return repository.searchByPersonal(term)
                .stream()
                .map(this::toDto)
                .toList();
    }

    public List<UsuarioRedConsultaDto> searchConsultas(String term) {
        String normalizedTerm = normalizeSearchTerm(term);
        if (normalizedTerm == null || normalizedTerm.length() < 2) {
            return listarTodos();
        }

        Map<String, ScoredConsulta> resultsByUser = new LinkedHashMap<>();
        if (isNamelessQuery(normalizedTerm)) {
            adUsuarioCacheRepository.findNameless(PageRequest.of(0, CONSULTA_LIMIT))
                    .forEach(user -> mergeUsuario(resultsByUser, user, normalizedTerm));
            return resultsByUser.values().stream()
                    .sorted(Comparator
                            .comparing((ScoredConsulta item) -> blankToLast(item.dto().getUsuario()))
                            .thenComparing(item -> blankToLast(item.dto().getDisplayName())))
                    .map(ScoredConsulta::dto)
                    .map(this::enrichContratosYVencimiento)
                    .toList();
        }

        List<String> terms = expandedTerms(normalizedTerm);
        for (String queryTerm : terms) {
            String accountTerm = normalizeAccountSearchTerm(queryTerm);
            adUsuarioCacheRepository.search(queryTerm, accountTerm, null, null, null, null, null, PageRequest.of(0, CANDIDATE_LIMIT))
                    .forEach(user -> mergeUsuario(resultsByUser, user, normalizedTerm));
            adUsuarioCacheRepository.consultaSearch(queryTerm, accountTerm, PageRequest.of(0, CANDIDATE_LIMIT))
                    .forEach(user -> mergeUsuario(resultsByUser, user, normalizedTerm));
            repository.searchAllFields(queryTerm, PageRequest.of(0, CANDIDATE_LIMIT))
                    .forEach(contrato -> mergeContrato(resultsByUser, contrato, normalizedTerm));
        }
        mergeAcronymMatches(resultsByUser, normalizedTerm);

        return resultsByUser.values().stream()
                .sorted(Comparator
                        .comparingInt(ScoredConsulta::score).reversed()
                        .thenComparing(item -> blankToLast(item.dto().getDisplayName()))
                        .thenComparing(item -> blankToLast(item.dto().getUsuario())))
                .map(ScoredConsulta::dto)
                .map(this::enrichContratosYVencimiento)
                .limit(CONSULTA_LIMIT)
                .toList();
    }

    private List<UsuarioRedConsultaDto> listarTodos() {
        Map<String, UsuarioRedConsultaDto> resultados = new LinkedHashMap<>();

        adUsuarioCacheRepository.findAll().forEach(user ->
                resultados.putIfAbsent(resultKey(user.getSamAccountName(), "ad-" + user.getSamAccountName()), toConsultaDto(user)));

        repository.findAll().forEach(contrato -> {
            String key = resultKey(contrato.getUsuario(), "contrato-" + contrato.getId());
            resultados.computeIfAbsent(key, k -> toConsultaDto(contrato));
        });

        return resultados.values().stream()
                .map(this::enrichContratosYVencimiento)
                .sorted(Comparator
                        .comparing((UsuarioRedConsultaDto dto) -> blankToLast(dto.getDisplayName()))
                        .thenComparing(dto -> blankToLast(dto.getUsuario())))
                .toList();
    }

    @Transactional
    public UsuarioRedContratoDto create(UsuarioRedContratoRequest request, String username) {
        UsuarioRedContrato contrato = new UsuarioRedContrato();
        copyFields(contrato, request);
        contrato.setRegistradoPor(username);
        contrato.setFechaRegistro(LocalDateTime.now());
        return toDto(repository.save(contrato));
    }

    @Transactional
    public UsuarioRedContratoDto update(Long id, UsuarioRedContratoRequest request, String username) {
        UsuarioRedContrato contrato = findEntityById(id);
        copyFields(contrato, request);
        contrato.setActualizadoPor(username);
        contrato.setFechaActualizacion(LocalDateTime.now());
        return toDto(repository.save(contrato));
    }

    public void delete(Long id) {
        repository.delete(findEntityById(id));
    }

    private UsuarioRedContrato findEntityById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contrato no encontrado: " + id));
    }

    private void copyFields(UsuarioRedContrato contrato, UsuarioRedContratoRequest request) {
        if (request.getFechaFin() != null && request.getFechaFin().isBefore(request.getFechaInicio())) {
            throw new IllegalArgumentException("La fecha fin no puede ser anterior a la fecha inicio");
        }
        contrato.setUsuario(resolveUsuarioRed(request.getUsuario()).getSamAccountName());
        contrato.setFechaInicio(request.getFechaInicio());
        contrato.setFechaFin(request.getFechaFin());
        contrato.setNumeroContrato(request.getNumeroContrato());
        contrato.setPersonalNombre(request.getPersonalNombre());
        contrato.setPersonalApellidos(request.getPersonalApellidos());
        contrato.setTipoContrato(tipoContratoRepository.findById(request.getTipoContratoId())
                .orElseThrow(() -> new ResourceNotFoundException("Tipo de contrato no encontrado: " + request.getTipoContratoId())));
    }

    private UsuarioRedContratoDto toDto(UsuarioRedContrato entity) {
        UsuarioRedContratoDto dto = new UsuarioRedContratoDto();
        dto.setId(entity.getId());
        dto.setUsuario(entity.getUsuario());
        TipoContrato tipoContrato = entity.getTipoContrato();
        if (tipoContrato != null) {
            dto.setTipoContratoId(tipoContrato.getId());
            dto.setTipoContratoNombre(tipoContrato.getNombre());
        }
        dto.setFechaInicio(entity.getFechaInicio());
        dto.setFechaFin(entity.getFechaFin());
        dto.setNumeroContrato(entity.getNumeroContrato());
        dto.setPersonalNombre(entity.getPersonalNombre());
        dto.setPersonalApellidos(entity.getPersonalApellidos());
        dto.setRegistradoPor(entity.getRegistradoPor());
        dto.setFechaRegistro(entity.getFechaRegistro());
        dto.setActualizadoPor(entity.getActualizadoPor());
        dto.setFechaActualizacion(entity.getFechaActualizacion());
        return dto;
    }

    private void mergeUsuario(Map<String, ScoredConsulta> resultsByUser, AdUsuarioCache user, String term) {
        mergeUsuario(resultsByUser, user, term, 0);
    }

    private void mergeUsuario(Map<String, ScoredConsulta> resultsByUser, AdUsuarioCache user, String term, int bonus) {
        String key = resultKey(user.getSamAccountName(), "ad-" + user.getSamAccountName());
        ScoredConsulta result = resultsByUser.get(key);
        int score = scoreAccount(term, user.getSamAccountName(), user.getUserPrincipalName())
                + scoreFields(term, user.getDisplayName(),
                user.getGivenName(), user.getSurname(), user.getMail(), user.getDepartment(), user.getCompany(),
                user.getTitle(), user.getTelephoneNumber(), user.getMobile(), user.getOffice(), user.getDescription(),
                user.getDistinguishedName(), user.getOrganizationalUnit(), user.getWhenCreated(), user.getWhenChanged(),
                user.getPwdLastSet(), user.getLastLogonTimestamp(), user.getAccountExpires(), user.getBadPwdCount()) + bonus;
        if (result == null) {
            resultsByUser.put(key, new ScoredConsulta(toConsultaDto(user), score));
            return;
        }
        result.addScore(score);
    }

    private void mergeContrato(Map<String, ScoredConsulta> resultsByUser, UsuarioRedContrato contrato, String term) {
        String key = normalizeAccountSearchTerm(contrato.getUsuario());
        if (key == null) {
            key = "contrato-" + contrato.getId();
        }
        ScoredConsulta result = resultsByUser.get(key);
        if (result == null) {
            UsuarioRedConsultaDto consulta = activeDirectoryService.buscarUsuarioCacheadoORefrescar(key)
                    .map(this::toConsultaDto)
                    .orElseGet(() -> toConsultaDto(contrato));
            result = new ScoredConsulta(consulta, 0);
            resultsByUser.put(key, result);
        }
        UsuarioRedContratoDto contratoDto = toDto(contrato);
        if (result.dto().getContratos().stream().noneMatch(existing -> Objects.equals(existing.getId(), contratoDto.getId()))) {
            result.dto().getContratos().add(contratoDto);
        }
        result.addScore(scoreAccount(term, contrato.getUsuario())
                + scoreFields(term, contrato.getPersonalNombre(), contrato.getPersonalApellidos(),
                joinName(contrato.getPersonalNombre(), contrato.getPersonalApellidos()), contrato.getNumeroContrato(),
                contrato.getTipoContrato() == null ? null : contrato.getTipoContrato().getNombre(),
                contrato.getRegistradoPor(), contrato.getActualizadoPor()));
    }

    private UsuarioRedConsultaDto toConsultaDto(AdUsuarioCache user) {
        UsuarioRedConsultaDto dto = new UsuarioRedConsultaDto();
        dto.setUsuario(user.getSamAccountName());
        dto.setDisplayName(user.getDisplayName());
        dto.setMail(user.getMail());
        dto.setOffice(user.getOffice());
        dto.setOrganizationalUnit(user.getOrganizationalUnit());
        dto.setEnabled(user.isEnabled());
        dto.setLocked(user.isLocked());
        return dto;
    }

    private AdUsuarioCache resolveUsuarioRed(String usuario) {
        String accountName = normalizeAccountSearchTerm(usuario);
        if (accountName == null) {
            throw new IllegalArgumentException("Selecciona un usuario de red valido.");
        }
        return activeDirectoryService.buscarUsuarioCacheadoORefrescar(accountName)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario de red no encontrado en Active Directory: " + usuario));
    }

    private UsuarioRedConsultaDto toConsultaDto(UsuarioRedContrato contrato) {
        UsuarioRedConsultaDto dto = new UsuarioRedConsultaDto();
        dto.setUsuario(contrato.getUsuario());
        String nombre = joinName(contrato.getPersonalNombre(), contrato.getPersonalApellidos());
        dto.setDisplayName(nombre == null ? contrato.getUsuario() : nombre);
        return dto;
    }

    private UsuarioRedConsultaDto enrichContratosYVencimiento(UsuarioRedConsultaDto dto) {
        if (dto.getUsuario() != null && !dto.getUsuario().isBlank()) {
            Set<Long> idsActuales = dto.getContratos().stream()
                    .map(UsuarioRedContratoDto::getId)
                    .filter(Objects::nonNull)
                    .collect(java.util.stream.Collectors.toSet());
            repository.findByUsuarioIgnoreCaseOrderByFechaInicioDesc(dto.getUsuario()).stream()
                    .map(this::toDto)
                    .filter(contrato -> contrato.getId() == null || !idsActuales.contains(contrato.getId()))
                    .forEach(dto.getContratos()::add);
        }
        dto.setVencimientoUsuarioRed(calcularVencimientoUsuarioRed(dto.getContratos()));
        dto.setEstadoVencimientoUsuarioRed(estadoVencimiento(dto.getVencimientoUsuarioRed()));
        return dto;
    }

    private LocalDate calcularVencimientoUsuarioRed(List<UsuarioRedContratoDto> contratos) {
        return contratos.stream()
                .map(UsuarioRedContratoDto::getFechaFin)
                .filter(Objects::nonNull)
                .max(LocalDate::compareTo)
                .orElse(null);
    }

    private String estadoVencimiento(LocalDate fecha) {
        if (fecha == null) {
            return "SIN_FECHA";
        }
        LocalDate hoy = LocalDate.now();
        if (fecha.isBefore(hoy)) {
            return "VENCIDO";
        }
        if (!fecha.isAfter(hoy.plusDays(30))) {
            return "POR_VENCER";
        }
        return "VIGENTE";
    }

    private String normalizeSearchTerm(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String normalizeAccountSearchTerm(String value) {
        String term = normalizeSearchTerm(value);
        if (term == null) {
            return null;
        }
        int slash = term.lastIndexOf('\\');
        if (slash >= 0 && slash + 1 < term.length()) {
            term = term.substring(slash + 1);
        }
        int at = term.indexOf('@');
        if (at > 0) {
            term = term.substring(0, at);
        }
        return term.trim().toLowerCase();
    }

    private String joinName(String nombre, String apellidos) {
        String fullName = ((nombre == null ? "" : nombre.trim()) + " " + (apellidos == null ? "" : apellidos.trim())).trim();
        return fullName.isBlank() ? null : fullName;
    }

    private String blankToLast(String value) {
        return value == null || value.isBlank() ? "~" : value.trim().toLowerCase();
    }

    private boolean isNamelessQuery(String term) {
        String normalized = normalizeForScore(term);
        return normalized.equals("sin nombre")
                || normalized.equals("sin nombres")
                || normalized.equals("nombre vacio")
                || normalized.equals("nombres vacios")
                || normalized.equals("display vacio")
                || normalized.equals("displayname vacio")
                || normalized.equals("sin display")
                || normalized.equals("sin displayname");
    }

    private String resultKey(String usuario, String fallback) {
        String key = normalizeAccountSearchTerm(usuario);
        return key == null ? fallback.toLowerCase() : key;
    }

    private List<String> expandedTerms(String term) {
        List<String> terms = new ArrayList<>();
        terms.add(term);
        tokenize(term).stream()
                .filter(token -> token.length() >= 2)
                .filter(token -> terms.stream().noneMatch(existing -> existing.equalsIgnoreCase(token)))
                .forEach(terms::add);
        aliasesFor(term).stream()
                .filter(alias -> terms.stream().noneMatch(existing -> existing.equalsIgnoreCase(alias)))
                .forEach(terms::add);
        String accountTerm = normalizeAccountSearchTerm(term);
        if (accountTerm != null && accountTerm.length() >= 2 && terms.stream().noneMatch(existing -> existing.equalsIgnoreCase(accountTerm))) {
            terms.add(accountTerm);
        }
        return terms;
    }

    private List<String> aliasesFor(String term) {
        String normalized = normalizeForScore(term);
        return switch (normalized) {
            case "informatica", "informatico", "uti", "ti" -> List.of(
                    "unidad de tecnologia de la informacion",
                    "tecnologia de la informacion",
                    "unidad de informatica",
                    "uti"
            );
            case "ddta", "didet" -> List.of(
                    "direccion de desarrollo tecnologico agrario",
                    "desarrollo tecnologico agrario",
                    "didet"
            );
            case "drgb" -> List.of(
                    "direccion de recursos geneticos y biotecnologia",
                    "recursos geneticos y biotecnologia",
                    "sub direccion de biotecnologia",
                    "subdireccion de biotecnologia",
                    "sub direccion de recursos geneticos",
                    "subdireccion de recursos geneticos",
                    "drgb"
            );
            case "sdrg" -> List.of(
                    "sub direccion de recursos geneticos",
                    "subdireccion de recursos geneticos",
                    "recursos geneticos",
                    "sdrg"
            );
            case "sdb" -> List.of(
                    "sub direccion de biotecnologia",
                    "subdireccion de biotecnologia",
                    "biotecnologia",
                    "sdb"
            );
            case "dgia" -> List.of(
                    "direccion de gestion de la innovacion agraria",
                    "gestion de la innovacion agraria",
                    "subdireccion de normatividad de la innovacion agraria",
                    "sub direccion de normatividad de la innovacion agraria",
                    "subdireccion de promocion de la innovacion agraria",
                    "sub direccion de promocion de la innovacion agraria",
                    "dgia"
            );
            case "oaj" -> List.of(
                    "oficina de asesoria juridica",
                    "asesoria juridica",
                    "oaj"
            );
            case "uii" -> List.of(
                    "unidad de imagen institucional",
                    "imagen institucional",
                    "unidad de comunicaciones e imagen institucional",
                    "comunicaciones e imagen institucional",
                    "uii",
                    "ucoim"
            );
            case "dsme" -> List.of(
                    "direccion de supervision y monitoreo en las eea",
                    "supervision y monitoreo",
                    "subdireccion de supervision y monitoreo",
                    "sub direccion de supervision y monitoreo",
                    "dsme"
            );
            case "dsea" -> List.of(
                    "direccion de servicios estrategicos agrarios",
                    "servicios estrategicos agrarios",
                    "direccion de supervision y monitoreo en las eea",
                    "supervision y monitoreo",
                    "subdireccion de extension agropecuaria",
                    "sub direccion de extension agropecuaria",
                    "dsea"
            );
            case "sdpa" -> List.of(
                    "sub direccion de productos agrarios",
                    "subdireccion de productos agrarios",
                    "productos agrarios",
                    "sdpa"
            );
            case "sdiee" -> List.of(
                    "subdireccion de investigacion y liberacion de tecnologias",
                    "sub direccion de investigacion y liberacion de tecnologias",
                    "investigacion y liberacion de tecnologias",
                    "sdiee"
            );
            case "sdpia" -> List.of(
                    "subdireccion de promocion de la innovacion agraria",
                    "sub direccion de promocion de la innovacion agraria",
                    "promocion de la innovacion agraria",
                    "sdpia"
            );
            case "ua" -> List.of("unidad de abastecimiento", "abastecimiento", "ua");
            default -> List.of();
        };
    }

    private void mergeAcronymMatches(Map<String, ScoredConsulta> resultsByUser, String term) {
        String normalized = normalizeForScore(term);
        if (normalized.length() < 2 || normalized.length() > 8 || normalized.contains(" ")) {
            return;
        }
        adUsuarioCacheRepository.findAll().stream()
                .filter(user -> acronymMatches(normalized, user.getDepartment(), user.getCompany(), user.getTitle(),
                        user.getOffice(), user.getDescription(), user.getOrganizationalUnit()))
                .forEach(user -> mergeUsuario(resultsByUser, user, term, 12000));
    }

    private int scoreFields(String term, String... values) {
        String normalizedTerm = normalizeForScore(term);
        String accountTerm = normalizeForScore(normalizeAccountSearchTerm(term));
        List<String> tokens = tokenize(term).stream().map(this::normalizeForScore).filter(token -> token.length() >= 2).toList();
        int score = 0;

        for (String value : values) {
            String normalizedValue = normalizeForScore(value);
            if (normalizedValue.isBlank()) {
                continue;
            }
            score += scoreOne(normalizedValue, normalizedTerm);
            if (!accountTerm.isBlank() && !accountTerm.equals(normalizedTerm)) {
                score += scoreOne(normalizedValue, accountTerm);
            }
            for (String token : tokens) {
                score += scoreOne(normalizedValue, token) / 4;
            }
        }
        long matchedTokens = tokens.stream()
                .filter(token -> fieldContainsToken(token, values))
                .count();
        score += (int) matchedTokens * 35;
        if (!tokens.isEmpty() && matchedTokens == tokens.size()) {
            score += 120;
        }
        return score;
    }

    private int scoreAccount(String term, String... values) {
        String normalizedTerm = normalizeForScore(term);
        String accountTerm = normalizeForScore(normalizeAccountSearchTerm(term));
        int score = 0;
        for (String value : values) {
            String normalizedValue = normalizeForScore(value);
            if (normalizedValue.isBlank()) {
                continue;
            }
            score += scoreAccountOne(normalizedValue, normalizedTerm);
            if (!accountTerm.isBlank() && !accountTerm.equals(normalizedTerm)) {
                score += scoreAccountOne(normalizedValue, accountTerm);
            }
        }
        return score;
    }

    private int scoreAccountOne(String value, String query) {
        if (query == null || query.isBlank()) {
            return 0;
        }
        if (value.equals(query)) {
            return 15000;
        }
        if (value.startsWith(query)) {
            return 10000;
        }
        if (value.contains(query)) {
            return 5000;
        }
        return 0;
    }

    private int scoreOne(String value, String query) {
        if (query == null || query.isBlank()) {
            return 0;
        }
        if (value.equals(query)) {
            return 1000;
        }
        if (value.startsWith(query)) {
            return 700;
        }
        if (value.contains(" " + query)) {
            return 520;
        }
        if (value.contains(query)) {
            return 300;
        }
        return 0;
    }

    private boolean fieldContainsToken(String token, String... values) {
        for (String value : values) {
            if (normalizeForScore(value).contains(token)) {
                return true;
            }
        }
        return false;
    }

    private List<String> tokenize(String value) {
        String normalized = normalizeForScore(value);
        if (normalized.isBlank()) {
            return List.of();
        }
        return java.util.Arrays.stream(normalized.split("[^a-z0-9]+"))
                .filter(token -> !token.isBlank())
                .distinct()
                .toList();
    }

    private boolean acronymMatches(String query, String... values) {
        for (String value : values) {
            if (acronymsFor(value).contains(query)) {
                return true;
            }
        }
        return false;
    }

    private Set<String> acronymsFor(String value) {
        List<String> words = tokenize(value);
        if (words.size() < 2) {
            return Set.of();
        }
        String all = words.stream().map(word -> word.substring(0, 1)).collect(java.util.stream.Collectors.joining());
        String meaningful = words.stream()
                .filter(word -> !ACRONYM_STOPWORDS.contains(word))
                .map(word -> word.substring(0, 1))
                .collect(java.util.stream.Collectors.joining());
        return meaningful.equals(all) ? Set.of(all) : Set.of(all, meaningful);
    }

    private String normalizeForScore(String value) {
        if (value == null) {
            return "";
        }
        String normalized = java.text.Normalizer.normalize(value.trim().toLowerCase(), java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return normalized.replace('ñ', 'n');
    }

    private record ScoredConsulta(UsuarioRedConsultaDto dto, Score scoreHolder) {
        ScoredConsulta(UsuarioRedConsultaDto dto, int score) {
            this(dto, new Score(score));
        }

        int score() {
            return scoreHolder.value;
        }

        void addScore(int score) {
            scoreHolder.value += score;
        }
    }

    private static class Score {
        private int value;

        private Score(int value) {
            this.value = value;
        }
    }
}
