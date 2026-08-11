package com.inia.soportedesk.activedirectory;

import com.inia.soportedesk.activedirectory.config.LdapContextFactory;
import com.inia.soportedesk.activedirectory.dto.ActiveDirectoryDashboard;
import com.inia.soportedesk.activedirectory.dto.ActiveDirectoryDashboardCompleto;
import com.inia.soportedesk.activedirectory.dto.ActiveDirectoryGroup;
import com.inia.soportedesk.activedirectory.dto.ActiveDirectoryOu;
import com.inia.soportedesk.activedirectory.dto.ActiveDirectoryResponse;
import com.inia.soportedesk.activedirectory.dto.AdFilterOption;
import com.inia.soportedesk.activedirectory.dto.AdSyncResponse;
import com.inia.soportedesk.activedirectory.dto.AdUserAlerta;
import com.inia.soportedesk.activedirectory.dto.AdUserSearchResult;
import com.inia.soportedesk.activedirectory.dto.AdUserSummary;
import com.inia.soportedesk.activedirectory.dto.AdUser;
import com.inia.soportedesk.activedirectory.dto.CreateAdUserRequest;
import com.inia.soportedesk.activedirectory.dto.GroupRequest;
import com.inia.soportedesk.activedirectory.dto.MoveUserRequest;
import com.inia.soportedesk.activedirectory.dto.OuUsuariosCount;
import com.inia.soportedesk.activedirectory.dto.OfficeUsuariosCount;
import com.inia.soportedesk.activedirectory.dto.ResetPasswordRequest;
import com.inia.soportedesk.activedirectory.dto.UpdateUserInfoRequest;
import com.inia.soportedesk.auditoria.AdAuditoriaRegistro;
import com.inia.soportedesk.auditoria.AdAuditoriaService;
import com.inia.soportedesk.auditoria.MovimientoAuditoriaService;
import com.inia.soportedesk.usuariosred.contrato.UsuarioRedContrato;
import com.inia.soportedesk.usuariosred.contrato.UsuarioRedContratoRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.naming.NamingEnumeration;
import javax.naming.PartialResultException;
import javax.naming.directory.AttributeInUseException;
import javax.naming.directory.Attribute;
import javax.naming.directory.Attributes;
import javax.naming.directory.BasicAttribute;
import javax.naming.directory.BasicAttributes;
import javax.naming.directory.DirContext;
import javax.naming.directory.ModificationItem;
import javax.naming.directory.NoSuchAttributeException;
import javax.naming.directory.SearchControls;
import javax.naming.directory.SearchResult;
import javax.naming.ldap.Control;
import javax.naming.ldap.LdapContext;
import javax.naming.ldap.LdapName;
import javax.naming.ldap.PagedResultsControl;
import javax.naming.ldap.PagedResultsResponseControl;
import javax.naming.ldap.Rdn;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ActiveDirectoryService {
    private static final Logger log = LoggerFactory.getLogger(ActiveDirectoryService.class);
    private static final int NORMAL_ACCOUNT = 0x0200;
    private static final int ACCOUNT_DISABLED = 0x0002;
    private static final int PASSWORD_EXPIRED_DAYS = 90;
    private static final int INACTIVE_ACCOUNT_DAYS = 60;
    private static final int LDAP_PAGE_SIZE = 1000;
    private static final int LDAP_MAX_PREFIX_DEPTH = 3;
    private static final String LDAP_MATCHING_RULE_BIT_AND = "1.2.840.113556.1.4.803";
    private static final String USER_SYNC_FILTER = "(&(objectCategory=person)(objectClass=user)(sAMAccountName=*))";
    private static final String LDAP_BUCKET_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789._-$";
    private static final String[] USER_ATTRIBUTES = {
            "sAMAccountName", "displayName", "givenName", "sn", "mail", "department", "company", "title",
            "telephoneNumber", "mobile", "physicalDeliveryOfficeName", "description", "distinguishedName",
            "userPrincipalName", "userAccountControl", "memberOf", "whenCreated", "whenChanged", "pwdLastSet",
            "lastLogonTimestamp", "accountExpires", "badPwdCount", "lockoutTime"
    };

    private final LdapContextFactory contextFactory;
    private final MovimientoAuditoriaService auditoriaService;
    private final HttpServletRequest request;
    private final AdUsuarioCacheRepository cacheRepository;
    private final AdCacheMetadataRepository metadataRepository;
    private final AdSyncJobStatus jobStatus;
    private final ApplicationEventPublisher eventPublisher;
    private final UsuarioRedContratoRepository contratoRepository;
    private final AdAuditoriaService adAuditoriaService;

    public AdUserSearchResult buscarUsuarios(String q, String usuario, String nombre, String oficina, String ou, String estado) {
        SearchStateFilter state = SearchStateFilter.from(estado);
        if (!hasSearchTerm(q) && !hasSearchTerm(usuario) && !hasSearchTerm(nombre) && !hasSearchTerm(oficina) && !hasSearchTerm(ou) && state.isAll()) {
            return new AdUserSearchResult(List.of(), false);
        }
        String normalizedQuery = normalizeSearchTerm(q);
        String normalizedUsuario = normalizeAccountSearchTerm(usuario);
        String normalizedNombre = normalizeSearchTerm(nombre);
        String normalizedOficina = normalizeSearchTerm(oficina);
        String normalizedOu = normalizeSearchTerm(ou);
        List<AdUserSummary> directUsers = cacheRepository.search(
                        normalizedQuery,
                        normalizedUsuario,
                        normalizedNombre,
                        normalizedOficina,
                        normalizedOu,
                        state.enabled(),
                        state.locked(),
                        PageRequest.of(0, 75)
                ).stream()
                .map(this::toUserSummary)
                .toList();
        Map<String, AdUserSummary> usersBySam = new LinkedHashMap<>();
        directUsers.forEach(user -> usersBySam.put(user.samAccountName().toLowerCase(java.util.Locale.ROOT), user));

        List<String> contractUsers = List.of();
        if (normalizedQuery != null || normalizedNombre != null) {
            contractUsers = findContractUsers(normalizedQuery, normalizedNombre);
            for (String contractUser : contractUsers) {
                if (usersBySam.size() >= 75) {
                    break;
                }
                cacheRepository.findFirstBySamAccountNameIgnoreCase(contractUser)
                        .filter(user -> matchesDirectoryFilters(
                                user, normalizedUsuario, normalizedOficina, normalizedOu, state))
                        .map(this::toUserSummary)
                        .ifPresent(user -> usersBySam.putIfAbsent(user.samAccountName().toLowerCase(java.util.Locale.ROOT), user));
            }
        }
        List<AdUserSummary> users = new ArrayList<>(usersBySam.values());
        String directLookup = directLookupTerm(q, usuario, nombre, oficina, ou, state);
        if (users.isEmpty() && directLookup != null) {
            AdUser refreshed = refreshCachedUserFromAd(directLookup);
            if (refreshed != null) {
                users = List.of(toUserSummary(refreshed));
            }
        }
        return new AdUserSearchResult(users, users.size() >= 75 || contractUsers.size() >= 75);
    }

    private boolean matchesDirectoryFilters(AdUsuarioCache user,
                                            String usuario,
                                            String oficina,
                                            String ou,
                                            SearchStateFilter state) {
        if (usuario != null && !containsAnyIgnoreCase(usuario,
                user.getSamAccountName(), user.getUserPrincipalName(), user.getMail())) {
            return false;
        }
        String effectiveOffice = hasSearchTerm(user.getOffice()) ? user.getOffice() : "Sin oficina";
        if (oficina != null && !containsIgnoreCase(effectiveOffice, oficina)) {
            return false;
        }
        String effectiveOu = hasSearchTerm(user.getOrganizationalUnit()) ? user.getOrganizationalUnit() : "Sin OU";
        if (ou != null && !containsIgnoreCase(effectiveOu, ou)) {
            return false;
        }
        if (state.enabled() != null && user.isEnabled() != state.enabled()) {
            return false;
        }
        return state.locked() == null || user.isLocked() == state.locked();
    }

    private List<String> findContractUsers(String query, String nombre) {
        LinkedHashSet<String> users = new LinkedHashSet<>(contratoRepository.findUsuariosForDirectorySearch(
                query, nombre, PageRequest.of(0, 75)));
        String flexibleTerm = query != null && nombre == null
                ? query
                : (query == null ? nombre : null);
        if (flexibleTerm == null) {
            return new ArrayList<>(users);
        }

        List<String> tokens = java.util.Arrays.stream(flexibleTerm.split("[^\\p{L}\\p{N}]+"))
                .map(String::trim)
                .filter(token -> token.length() >= 2)
                .distinct()
                .limit(6)
                .toList();
        if (tokens.size() < 2) {
            return new ArrayList<>(users);
        }
        Set<String> intersection = null;
        for (String token : tokens) {
            List<String> tokenUsers = query != null
                    ? contratoRepository.findUsuariosForDirectorySearch(token, null, PageRequest.of(0, 500))
                    : contratoRepository.findUsuariosForDirectorySearch(null, token, PageRequest.of(0, 500));
            Set<String> normalizedUsers = tokenUsers.stream()
                    .map(user -> user.toLowerCase(java.util.Locale.ROOT))
                    .collect(Collectors.toCollection(LinkedHashSet::new));
            if (intersection == null) {
                intersection = normalizedUsers;
            } else {
                intersection.retainAll(normalizedUsers);
            }
            if (intersection.isEmpty()) {
                break;
            }
        }
        if (intersection != null) {
            intersection.stream().limit(75).forEach(users::add);
        }
        return new ArrayList<>(users);
    }

    private boolean containsAnyIgnoreCase(String term, String... values) {
        for (String value : values) {
            if (containsIgnoreCase(value, term)) {
                return true;
            }
        }
        return false;
    }

    private boolean containsIgnoreCase(String value, String term) {
        return value != null && term != null
                && value.toLowerCase(java.util.Locale.ROOT).contains(term.toLowerCase(java.util.Locale.ROOT));
    }

    public ActiveDirectoryResponse<AdUser> buscarUsuarioPorSam(String samAccountName) {
        return cacheRepository.findFirstBySamAccountNameIgnoreCase(samAccountName)
                .map(user -> ActiveDirectoryResponse.ok("Usuario encontrado correctamente.", toUser(user)))
                .orElseGet(() -> ActiveDirectoryResponse.error("Usuario no encontrado en la cache local. Sincroniza Active Directory."));
    }

    public Optional<AdUsuarioCache> buscarUsuarioCacheadoORefrescar(String samAccountName) {
        String accountName = normalizeAccountSearchTerm(samAccountName);
        if (accountName == null) {
            return Optional.empty();
        }
        Optional<AdUsuarioCache> cached = cacheRepository.findFirstBySamAccountNameIgnoreCase(accountName);
        if (cached.isPresent()) {
            return cached;
        }
        AdUser refreshed = refreshCachedUserFromAd(accountName);
        if (refreshed == null) {
            return Optional.empty();
        }
        return cacheRepository.findFirstBySamAccountNameIgnoreCase(refreshed.samAccountName());
    }

    public List<AdFilterOption> listarUnidadesOrganizativas() {
        return cacheRepository.listOrganizationalUnits().stream()
                .map(row -> new AdFilterOption(blankToDefault((String) row[0], "Sin OU"), safeInt((Long) row[1])))
                .toList();
    }

    public List<AdFilterOption> listarOficinas() {
        return cacheRepository.listOffices().stream()
                .map(row -> new AdFilterOption(blankToDefault((String) row[0], "Sin oficina"), safeInt((Long) row[1])))
                .toList();
    }

    public ActiveDirectoryResponse<AdUser> desbloquearUsuario(String samAccountName) {
        return withUserWrite(samAccountName, "DESBLOQUEAR_CUENTA", "Cuenta desbloqueada correctamente.", (context, userDn, result) -> {
            context.modifyAttributes(userDn, new ModificationItem[]{
                    new ModificationItem(DirContext.REPLACE_ATTRIBUTE, new BasicAttribute("lockoutTime", "0"))
            });
            return new AdAuditoriaDetalle("Bloqueada", "Desbloqueada", null);
        });
    }

    public ActiveDirectoryResponse<AdUser> resetPassword(String samAccountName, ResetPasswordRequest body) {
        return withUserWrite(samAccountName, "RESET_PASSWORD", "Contrasena restablecida correctamente.", (context, userDn, result) -> {
            String quotedPassword = "\"" + body.newPassword() + "\"";
            context.modifyAttributes(userDn, new ModificationItem[]{
                    new ModificationItem(DirContext.REPLACE_ATTRIBUTE,
                            new BasicAttribute("unicodePwd", quotedPassword.getBytes(StandardCharsets.UTF_16LE))),
                    new ModificationItem(DirContext.REPLACE_ATTRIBUTE,
                            new BasicAttribute("pwdLastSet", body.forceChange() ? "0" : "-1"))
            });
            return new AdAuditoriaDetalle("Contrasena anterior no registrada por seguridad", "Contrasena restablecida",
                    "Cambio obligatorio al iniciar sesion: " + (body.forceChange() ? "Si" : "No"));
        });
    }

    public ActiveDirectoryResponse<AdUser> deshabilitarUsuario(String samAccountName) {
        return changeEnabled(samAccountName, false);
    }

    public ActiveDirectoryResponse<AdUser> habilitarUsuario(String samAccountName) {
        return changeEnabled(samAccountName, true);
    }

    public synchronized ActiveDirectoryResponse<Void> eliminarUsuario(String samAccountName) {
        Instant inicio = Instant.now();
        UUID idTransaccion = UUID.randomUUID();
        String userDn = null;
        DirContext context = null;
        try {
            context = contextFactory.openDirContext();
            SearchResult result = findUser(context, samAccountName, new String[]{"distinguishedName"});
            if (result == null) {
                audit("ELIMINAR_USUARIO", samAccountName, null, 404, "Usuario no encontrado.");
                auditAd("ELIMINAR_USUARIO", samAccountName, null, "FALLIDO", "Usuario no encontrado.",
                        null, null, null, idTransaccion, inicio);
                return ActiveDirectoryResponse.error("Usuario no encontrado.");
            }

            userDn = result.getNameInNamespace();
            context.destroySubcontext(userDn);
            cacheRepository.findFirstBySamAccountNameIgnoreCase(samAccountName)
                    .ifPresent(cacheRepository::delete);
            audit("ELIMINAR_USUARIO", samAccountName, userDn, 200, "Usuario eliminado correctamente.");
            auditAd("ELIMINAR_USUARIO", samAccountName, userDn, "EXITOSO", "Usuario eliminado correctamente.",
                    "Usuario existia", "Usuario eliminado", "DN eliminado: " + userDn, idTransaccion, inicio);
            eventPublisher.publishEvent(new AdCambioEvent(samAccountName, "ELIMINAR_USUARIO"));
            return ActiveDirectoryResponse.ok("Usuario eliminado correctamente.", null);
        } catch (Exception e) {
            log.warn("Error eliminando usuario de Active Directory para samAccountName={}", samAccountName, e);
            audit("ELIMINAR_USUARIO", samAccountName, userDn, 500, e.getMessage());
            auditAd("ELIMINAR_USUARIO", samAccountName, userDn, "FALLIDO", e.getMessage(), null, null,
                    e.getMessage(), idTransaccion, inicio);
            return ActiveDirectoryResponse.error(
                    "No se pudo eliminar el usuario de Active Directory. Verifique sus dependencias e intente nuevamente.");
        } finally {
            closeQuietly(context);
        }
    }

    public ActiveDirectoryResponse<AdUser> moverUsuarioOu(String samAccountName, MoveUserRequest body) {
        return withUserWrite(samAccountName, "MOVER_OU", "Usuario movido correctamente.", (context, userDn, result) -> {
            String targetOu = body.ouDestinoDn().trim();
            if (!targetOu.toLowerCase().endsWith(contextFactory.baseDn().toLowerCase())) {
                throw new IllegalArgumentException("La OU destino debe pertenecer a " + contextFactory.baseDn());
            }
            String cn = attr(result.getAttributes(), "cn");
            if (cn == null || cn.isBlank()) {
                cn = dnFirstSegment(userDn);
            } else {
                cn = "CN=" + cn;
            }
            String dnNuevo = cn + "," + targetOu;
            String ouOrigen = extractOus(userDn);
            String ouDestino = extractOus(targetOu);
            context.rename(new LdapName(userDn), new LdapName(dnNuevo));
            String detalle = "OU origen: " + ouOrigen + " | OU destino: " + ouDestino
                    + " | DN anterior: " + userDn + " | DN nuevo: " + dnNuevo;
            return new AdAuditoriaDetalle(ouOrigen, ouDestino, detalle);
        });
    }

    public ActiveDirectoryResponse<AdUser> agregarUsuarioGrupo(String samAccountName, GroupRequest body) {
        return modifyGroup(samAccountName, body.groupDn(), DirContext.ADD_ATTRIBUTE, "AGREGAR_GRUPO",
                "Usuario agregado correctamente al grupo.");
    }

    public ActiveDirectoryResponse<AdUser> quitarUsuarioGrupo(String samAccountName, GroupRequest body) {
        return modifyGroup(samAccountName, body.groupDn(), DirContext.REMOVE_ATTRIBUTE, "QUITAR_GRUPO",
                "Usuario quitado correctamente del grupo.");
    }

    public synchronized ActiveDirectoryResponse<AdUser> actualizarInformacionUsuario(String samAccountName, UpdateUserInfoRequest body) {
        return withUserWrite(samAccountName, "ACTUALIZAR_INFO", "Informacion del usuario actualizada correctamente.", (context, userDn, result) -> {
            if (!body.clearMail() && body.mail() != null && !body.mail().isBlank()) {
                ensureMailIsUniqueInDirectory(context, body.mail(), samAccountName);
            }
            String department = blankToNull(body.department());
            String office = firstNonBlank(body.office(), department);
            List<ModificationItem> mods = new ArrayList<>();
            addReplace(mods, "displayName", body.displayName());
            addReplace(mods, "title", body.title());
            addReplace(mods, "department", department);
            addReplace(mods, "physicalDeliveryOfficeName", office);
            addReplace(mods, "telephoneNumber", body.telephoneNumber());
            addReplace(mods, "mobile", body.mobile());
            if (body.clearMail()) {
                addReplaceOrRemove(mods, "mail", null);
            } else {
                addReplace(mods, "mail", body.mail());
            }
            addReplace(mods, "description", body.description());
            if (mods.isEmpty()) {
                throw new IllegalArgumentException("No hay informacion para actualizar.");
            }
            String detalle = describirCambiosInfo(result.getAttributes(), body);
            context.modifyAttributes(userDn, mods.toArray(ModificationItem[]::new));
            return new AdAuditoriaDetalle("Informacion anterior", "Informacion actualizada", detalle);
        });
    }

    public synchronized ActiveDirectoryResponse<AdUser> crearUsuario(CreateAdUserRequest body) {
        Instant inicio = Instant.now();
        UUID idTransaccion = UUID.randomUUID();
        String sam = body.samAccountName().trim();
        String userDn = null;
        DirContext context = null;
        try {
            context = contextFactory.openDirContext();
            if (findUser(context, sam, new String[]{"distinguishedName"}) != null) {
                audit("CREAR_USUARIO", sam, null, 400, "El usuario ya existe.");
                auditAd("CREAR_USUARIO", sam, null, "FALLIDO", "El usuario ya existe.",
                        "No existia", "Error de creacion", "El usuario ya existe en Active Directory.",
                        idTransaccion, inicio);
                return ActiveDirectoryResponse.error("El usuario ya existe en Active Directory.");
            }
            if (body.mail() != null && !body.mail().isBlank()) {
                ensureMailIsUniqueInDirectory(context, body.mail(), null);
            }

            String targetOu = body.ouDestinoDn().trim();
            validateTargetOu(targetOu);
            String givenName = body.givenName().trim();
            String surname = body.surname().trim();
            String displayName = firstNonBlank(body.displayName(), givenName + " " + surname, sam);
            String upn = firstNonBlank(body.userPrincipalName(), sam + "@" + domainFromBaseDn());
            userDn = "CN=" + Rdn.escapeValue(displayName) + "," + targetOu;

            BasicAttributes attrs = new BasicAttributes(true);
            BasicAttribute objectClass = new BasicAttribute("objectClass");
            objectClass.add("top");
            objectClass.add("person");
            objectClass.add("organizationalPerson");
            objectClass.add("user");
            attrs.put(objectClass);
            attrs.put("cn", displayName);
            attrs.put("sAMAccountName", sam);
            attrs.put("givenName", givenName);
            attrs.put("sn", surname);
            attrs.put("displayName", displayName);
            attrs.put("userPrincipalName", upn);
            attrs.put("userAccountControl", String.valueOf(NORMAL_ACCOUNT | ACCOUNT_DISABLED));
            String department = blankToNull(body.department());
            String office = firstNonBlank(body.office(), department);
            putIfPresent(attrs, "mail", body.mail());
            putIfPresent(attrs, "title", body.title());
            putIfPresent(attrs, "department", department);
            putIfPresent(attrs, "physicalDeliveryOfficeName", office);
            putIfPresent(attrs, "telephoneNumber", body.telephoneNumber());
            putIfPresent(attrs, "mobile", body.mobile());
            putIfPresent(attrs, "description", body.description());

            context.createSubcontext(userDn, attrs);
            try {
                String quotedPassword = "\"" + body.temporaryPassword() + "\"";
                context.modifyAttributes(userDn, new ModificationItem[]{
                        new ModificationItem(DirContext.REPLACE_ATTRIBUTE,
                                new BasicAttribute("unicodePwd", quotedPassword.getBytes(StandardCharsets.UTF_16LE))),
                        new ModificationItem(DirContext.REPLACE_ATTRIBUTE,
                                new BasicAttribute("pwdLastSet", body.forceChange() ? "0" : "-1")),
                        new ModificationItem(DirContext.REPLACE_ATTRIBUTE,
                                new BasicAttribute("userAccountControl", String.valueOf(body.enabled() ? NORMAL_ACCOUNT : NORMAL_ACCOUNT | ACCOUNT_DISABLED)))
                });
            } catch (Exception e) {
                destroyCreatedUserQuietly(context, userDn);
                throw e;
            }

            audit("CREAR_USUARIO", sam, userDn, 201, "Usuario creado correctamente.");
            String detalleCreacion = "SAM: " + sam + " | Nombre: " + displayName + " | OU: " + extractOus(targetOu)
                    + " | Cambio obligatorio: " + (body.forceChange() ? "Si" : "No");
            auditAd("CREAR_USUARIO", sam, userDn, "EXITOSO", "Usuario creado correctamente.",
                    "No existia", "Usuario creado y habilitado", detalleCreacion, idTransaccion, inicio);
            eventPublisher.publishEvent(new AdCambioEvent(sam, "CREAR_USUARIO"));
            AdUser refreshed = refreshCachedUserFromAd(sam, userDn);
            return ActiveDirectoryResponse.ok("Usuario creado correctamente.", refreshed);
        } catch (IllegalArgumentException e) {
            audit("CREAR_USUARIO", sam, userDn, 400, e.getMessage());
            auditAd("CREAR_USUARIO", sam, userDn, "FALLIDO", e.getMessage(), "No existia", "Error de creacion",
                    e.getMessage(), idTransaccion, inicio);
            return ActiveDirectoryResponse.error(e.getMessage());
        } catch (Exception e) {
            log.warn("Error creando usuario en Active Directory para samAccountName={}", sam, e);
            audit("CREAR_USUARIO", sam, userDn, 500, e.getMessage());
            auditAd("CREAR_USUARIO", sam, userDn, "FALLIDO", e.getMessage(), "No existia", "Error de creacion",
                    e.getMessage(), idTransaccion, inicio);
            return ActiveDirectoryResponse.error(
                    "No se pudo crear el usuario en Active Directory. Verifique la conexion e intente nuevamente.");
        } finally {
            closeQuietly(context);
        }
    }

    public List<ActiveDirectoryGroup> buscarGrupos(String nombre) {
        if (nombre == null || nombre.trim().length() < 2) {
            return List.of();
        }
        String filter = "(&(objectCategory=group)(cn=*" + LdapFilterUtils.escape(nombre.trim()) + "*))";
        return searchGroups(filter, 25);
    }

    public List<ActiveDirectoryGroup> obtenerGruposUsuario(String samAccountName) {
        DirContext context = null;
        try {
            context = contextFactory.openDirContext();
            SearchResult result = findUser(context, samAccountName, new String[]{"memberOf"});
            if (result == null) {
                return List.of();
            }
            Attribute memberOf = result.getAttributes().get("memberOf");
            if (memberOf == null) {
                return List.of();
            }
            List<ActiveDirectoryGroup> groups = new ArrayList<>();
            NamingEnumeration<?> values = memberOf.getAll();
            while (values.hasMore()) {
                String dn = values.next().toString();
                groups.add(new ActiveDirectoryGroup(extractCn(dn), dn, ""));
            }
            return groups;
        } catch (Exception e) {
            return List.of();
        } finally {
            closeQuietly(context);
        }
    }

    public List<ActiveDirectoryOu> buscarOus(String nombre) {
        if (nombre == null || nombre.trim().length() < 2) {
            return List.of();
        }
        List<ActiveDirectoryOu> ous = new ArrayList<>();
        String filter = "(&(objectCategory=organizationalUnit)(ou=*" + LdapFilterUtils.escape(nombre.trim()) + "*))";
        DirContext context = null;
        try {
            context = contextFactory.openDirContext();
            SearchControls controls = controls(new String[]{"ou", "distinguishedName"}, 25);
            NamingEnumeration<SearchResult> results = context.search(contextFactory.baseDn(), filter, controls);
            while (results.hasMore()) {
                SearchResult result = results.next();
                ous.add(new ActiveDirectoryOu(attr(result.getAttributes(), "ou"), result.getNameInNamespace()));
            }
        } catch (PartialResultException ignored) {
            return ous;
        } catch (Exception ignored) {
            return List.of();
        } finally {
            closeQuietly(context);
        }
        return ous;
    }

    public ActiveDirectoryDashboard obtenerDashboard() {
        int enabled = safeInt(cacheRepository.countByEnabledTrue());
        int disabled = safeInt(cacheRepository.countByEnabledFalse());
        int locked = safeInt(cacheRepository.countByLockedTrue());
        int dcs = metadataInt("controladores_dominio");
        return new ActiveDirectoryDashboard(enabled, locked, disabled, dcs);
    }

    public ActiveDirectoryDashboardCompleto obtenerDashboardCompleto() {
        try {
            int enabled = safeInt(cacheRepository.countByEnabledTrue());
            int disabled = safeInt(cacheRepository.countByEnabledFalse());
            int locked = safeInt(cacheRepository.countByLockedTrue());
            int dcs = metadataInt("controladores_dominio");

            List<OfficeUsuariosCount> offices = java.util.Optional.ofNullable(cacheRepository.countGroupedByOfficeAndEnabled())
                    .orElseGet(List::of).stream()
                    .filter(row -> "Activo".equals(row[1]))
                    .map(row -> new OfficeUsuariosCount(blankToDefault((String) row[0], "Sin oficina"), safeInt((Long) row[2])))
                    .sorted(Comparator.comparing(OfficeUsuariosCount::activos).reversed().thenComparing(OfficeUsuariosCount::oficina))
                    .toList();

            List<OuUsuariosCount> ous = cacheRepository.countEnabledByOu().stream()
                    .map(row -> new OuUsuariosCount(blankToDefault((String) row[0], "Sin OU"), safeInt((Long) row[1])))
                    .sorted(Comparator.comparing(OuUsuariosCount::activos).reversed().thenComparing(OuUsuariosCount::ou))
                    .toList();

            long totalPasswords = cacheRepository.countByDaysSincePasswordChangeGreaterThan((long) PASSWORD_EXPIRED_DAYS);
            long totalInactive = cacheRepository.countByDaysSinceLastLogonGreaterThan((long) INACTIVE_ACCOUNT_DAYS);
            List<AdUsuarioCache> passwords = cacheRepository.findTop10ByDaysSincePasswordChangeGreaterThanOrderByDaysSincePasswordChangeDesc((long) PASSWORD_EXPIRED_DAYS);
            List<AdUsuarioCache> inactive = cacheRepository.findTop10ByDaysSinceLastLogonGreaterThanOrderByDaysSinceLastLogonDesc((long) INACTIVE_ACCOUNT_DAYS);
            List<AdUsuarioCache> blocked = cacheRepository.findTop10ByLockedTrueOrderByLockoutTimeDesc();
            LocalDate hoy = LocalDate.now();
            List<UsuarioRedContrato> contratosPorVencer = java.util.Optional.ofNullable(
                    contratoRepository.findVencimientosUsuarioRed(hoy, hoy.plusDays(30)))
                    .orElseGet(List::of);

            return new ActiveDirectoryDashboardCompleto(
                    enabled,
                    disabled,
                    locked,
                    dcs,
                    offices,
                    ous,
                    topAlerts(passwords, "dias sin cambiar clave", AdUsuarioCache::getDaysSincePasswordChange),
                    safeInt(totalPasswords),
                    topAlerts(inactive, "dias sin iniciar sesion", AdUsuarioCache::getDaysSinceLastLogon),
                    safeInt(totalInactive),
                    blocked.stream()
                            .limit(10)
                            .map(row -> new AdUserAlerta(row.getSamAccountName(), row.getDisplayName(), lockoutDetail(row.getLockoutTime())))
                            .toList(),
                    locked,
                    contratoAlerts(contratosPorVencer, hoy),
                    contratosPorVencer.size()
            );
        } catch (Exception e) {
            log.warn("Error construyendo dashboard completo de Active Directory", e);
            return emptyDashboardCompleto();
        }
    }

    @Transactional
    public AdSyncResponse sincronizarCache() {
        LocalDateTime syncedAt = LocalDateTime.now();
        int estimatedTotal = countPaged(USER_SYNC_FILTER);
        jobStatus.setTotal(estimatedTotal);
        List<AdUsuarioCache> users = collectCacheUsersFromAd(syncedAt);
        if (users.size() > estimatedTotal) {
            jobStatus.setTotal(users.size());
        }
        int dcs = countPaged("(&(objectCategory=computer)(userAccountControl:" + LDAP_MATCHING_RULE_BIT_AND + ":=8192))");
        cacheRepository.saveAll(users);
        if (!users.isEmpty()) {
            // Sync trae el universo completo de usuarios cada vez; lo no tocado en esta corrida ya no existe en AD.
            cacheRepository.deleteBySyncedAtBefore(syncedAt);
        }
        metadataRepository.save(new AdCacheMetadata("controladores_dominio", String.valueOf(dcs), syncedAt));
        metadataRepository.save(new AdCacheMetadata("ultima_sincronizacion", syncedAt.toString(), syncedAt));
        return new AdSyncResponse(users.size(), dcs, syncedAt);
    }

    private ActiveDirectoryResponse<AdUser> changeEnabled(String samAccountName, boolean enabled) {
        return withUserWrite(samAccountName, enabled ? "HABILITAR_CUENTA" : "DESHABILITAR_CUENTA",
                enabled ? "Cuenta habilitada correctamente." : "Cuenta deshabilitada correctamente.",
                (context, userDn, result) -> {
                    int uac = parseInt(attr(result.getAttributes(), "userAccountControl"));
                    int next = enabled ? (uac & ~ACCOUNT_DISABLED) : (uac | ACCOUNT_DISABLED);
                    context.modifyAttributes(userDn, new ModificationItem[]{
                            new ModificationItem(DirContext.REPLACE_ATTRIBUTE,
                                    new BasicAttribute("userAccountControl", String.valueOf(next)))
                    });
                    return enabled
                            ? new AdAuditoriaDetalle("Deshabilitada", "Habilitada", null)
                            : new AdAuditoriaDetalle("Habilitada", "Deshabilitada", null);
                });
    }

    private ActiveDirectoryResponse<AdUser> modifyGroup(String samAccountName, String groupDn, int operation,
                                                        String action, String message) {
        boolean agregando = operation == DirContext.ADD_ATTRIBUTE;
        return withUserWrite(samAccountName, action, message, (context, userDn, result) -> {
            try {
                context.modifyAttributes(groupDn.trim(), new ModificationItem[]{
                        new ModificationItem(operation, new BasicAttribute("member", userDn))
                });
            } catch (AttributeInUseException e) {
                throw new IllegalStateException("El usuario ya pertenece a este grupo.");
            } catch (NoSuchAttributeException e) {
                throw new IllegalStateException("El usuario no pertenece a este grupo.");
            }
            String detalle = "Grupo: " + extractCn(groupDn.trim()) + " | DN grupo: " + groupDn.trim();
            return agregando
                    ? new AdAuditoriaDetalle("No pertenece", "Pertenece", detalle)
                    : new AdAuditoriaDetalle("Pertenece", "No pertenece", detalle);
        });
    }

    private ActiveDirectoryResponse<AdUser> withUserWrite(String samAccountName, String action, String successMessage,
                                                         UserWriteOperation operation) {
        Instant inicio = Instant.now();
        UUID idTransaccion = UUID.randomUUID();
        String userDn = null;
        DirContext context = null;
        try {
            context = contextFactory.openDirContext();
            SearchResult result = findUser(context, samAccountName, USER_ATTRIBUTES);
            if (result == null) {
                audit(action, samAccountName, null, 404, "Usuario no encontrado.");
                auditAd(action, samAccountName, null, "FALLIDO", "Usuario no encontrado.", null, null, null,
                        idTransaccion, inicio);
                return ActiveDirectoryResponse.error("Usuario no encontrado.");
            }
            userDn = result.getNameInNamespace();
            AdAuditoriaDetalle detalle = operation.apply(context, userDn, result);
            audit(action, samAccountName, userDn, 200, successMessage);
            auditAd(action, samAccountName, userDn, "EXITOSO", successMessage,
                    detalle.estadoAnterior(), detalle.estadoNuevo(), detalle.detalleExito(), idTransaccion, inicio);
            eventPublisher.publishEvent(new AdCambioEvent(samAccountName, action));
            AdUser refreshed = refreshCachedUserFromAd(samAccountName);
            return ActiveDirectoryResponse.ok(successMessage, refreshed);
        } catch (IllegalArgumentException | IllegalStateException e) {
            audit(action, samAccountName, userDn, 400, e.getMessage());
            auditAd(action, samAccountName, userDn, "FALLIDO", e.getMessage(), null, null, e.getMessage(),
                    idTransaccion, inicio);
            return ActiveDirectoryResponse.error(e.getMessage());
        } catch (Exception e) {
            log.warn("Error ejecutando accion {} en Active Directory para samAccountName={}", action, samAccountName, e);
            audit(action, samAccountName, userDn, 500, e.getMessage());
            auditAd(action, samAccountName, userDn, "FALLIDO", e.getMessage(), null, null, e.getMessage(),
                    idTransaccion, inicio);
            return ActiveDirectoryResponse.error(
                    "No se pudo completar la accion en Active Directory. Verifique la conexion e intente nuevamente.");
        } finally {
            closeQuietly(context);
        }
    }

    private SearchResult findUser(DirContext context, String samAccountName, String[] returningAttributes) throws Exception {
        String accountName = normalizeAccountSearchTerm(samAccountName);
        if (accountName == null) {
            return null;
        }
        SearchResult cachedResult = findUserByCachedDn(context, accountName, returningAttributes);
        if (cachedResult != null) {
            return cachedResult;
        }
        String escapedAccount = LdapFilterUtils.escape(accountName);
        String escapedOriginal = LdapFilterUtils.escape(samAccountName.trim());
        String filter = "(&(objectCategory=person)(objectClass=user)(|(sAMAccountName=" + escapedAccount + ")(userPrincipalName=" + escapedOriginal + ")))";
        try {
            NamingEnumeration<SearchResult> results = context.search(contextFactory.baseDn(), filter, controls(returningAttributes, 1));
            return results.hasMore() ? results.next() : null;
        } catch (PartialResultException e) {
            log.debug("Busqueda AD parcial para samAccountName={}; se continua sin resultado directo.", accountName);
            return null;
        }
    }

    String buildUserSearchFilter(String usuario, String nombre, String oficina) {
        StringBuilder filter = new StringBuilder("(&(objectCategory=person)(objectClass=user)");
        appendAccountContainsFilter(filter, usuario);
        appendContainsFilter(filter, "displayName", nombre);
        appendContainsFilter(filter, "physicalDeliveryOfficeName", oficina);
        filter.append(")");
        return filter.toString();
    }

    private void appendAccountContainsFilter(StringBuilder filter, String value) {
        if (!hasSearchTerm(value)) {
            return;
        }
        String raw = value.trim();
        String account = normalizeAccountSearchTerm(raw);
        filter.append("(|");
        appendContainsFilter(filter, "sAMAccountName", account);
        appendContainsFilter(filter, "userPrincipalName", raw);
        appendContainsFilter(filter, "mail", raw);
        filter.append(")");
    }

    private void appendContainsFilter(StringBuilder filter, String attribute, String value) {
        if (hasSearchTerm(value)) {
            filter.append("(")
                    .append(attribute)
                    .append("=*")
                    .append(LdapFilterUtils.escape(value.trim()))
                    .append("*)");
        }
    }

    private boolean hasSearchTerm(String value) {
        return value != null && value.trim().length() >= 2;
    }

    private String normalizeSearchTerm(String value) {
        return hasSearchTerm(value) ? value.trim() : null;
    }

    private String normalizeAccountSearchTerm(String value) {
        if (!hasSearchTerm(value)) {
            return null;
        }
        String term = value.trim();
        int slash = Math.max(term.lastIndexOf('\\'), term.lastIndexOf('/'));
        if (slash >= 0 && slash + 1 < term.length()) {
            term = term.substring(slash + 1).trim();
        }
        int at = term.indexOf('@');
        if (at > 0 && isKnownAdDomain(term.substring(at + 1))) {
            return term.substring(0, at).trim();
        }
        return term;
    }

    private boolean isKnownAdDomain(String domain) {
        if (domain == null || domain.isBlank()) {
            return false;
        }
        String normalized = domain.trim().toLowerCase();
        String configuredDomain = contextFactory == null ? "" : domainFromBaseDn().toLowerCase();
        return normalized.equals(configuredDomain) || normalized.equals("inia.local");
    }

    private String directLookupTerm(String q, String usuario, String nombre, String oficina, String ou, SearchStateFilter state) {
        String term = null;
        if (hasSearchTerm(q) && !hasSearchTerm(usuario) && !hasSearchTerm(nombre) && !hasSearchTerm(oficina) && !hasSearchTerm(ou)) {
            term = normalizeAccountSearchTerm(q);
        }
        if (hasSearchTerm(usuario) && !hasSearchTerm(q) && !hasSearchTerm(nombre) && !hasSearchTerm(oficina) && !hasSearchTerm(ou)) {
            term = normalizeAccountSearchTerm(usuario);
        }
        if (term == null || !state.isAll() || term.contains(" ")) {
            return null;
        }
        return term;
    }

    private List<AdUsuarioCache> collectCacheUsersFromAd(LocalDateTime syncedAt) {
        LdapContext context = null;
        try {
            context = contextFactory.openLdapContext();
            Map<String, AdUsuarioCache> usersBySam = new LinkedHashMap<>();
            for (char bucket : LDAP_BUCKET_CHARS.toCharArray()) {
                collectCacheUsersByPrefix(context, String.valueOf(bucket), syncedAt, usersBySam);
            }
            collectCacheUsersForOtherPrefixes(context, syncedAt, usersBySam);
            return new ArrayList<>(usersBySam.values());
        } catch (Exception e) {
            throw new RuntimeException("Error sincronizando cache de Active Directory: " + e.getMessage(), e);
        } finally {
            closeQuietly(context);
        }
    }

    private void ensureMailIsUniqueInDirectory(DirContext context, String mail, String currentSamAccountName) throws Exception {
        String normalizedMail = mail.trim();
        String filter = "(&(objectCategory=person)(objectClass=user)(mail="
                + LdapFilterUtils.escape(normalizedMail) + "))";
        NamingEnumeration<SearchResult> results = null;
        try {
            results = context.search(contextFactory.baseDn(), filter,
                    controls(new String[]{"sAMAccountName", "mail"}, 5));
            while (results.hasMore()) {
                SearchResult result = results.next();
                String ownerSam = attr(result.getAttributes(), "sAMAccountName");
                if (currentSamAccountName == null || ownerSam == null
                        || !ownerSam.equalsIgnoreCase(normalizeAccountSearchTerm(currentSamAccountName))) {
                    throw new IllegalArgumentException(
                            "El correo " + normalizedMail + " ya esta vinculado a otro usuario de red en Active Directory.");
                }
            }
        } catch (PartialResultException ignored) {
            // Active Directory puede devolver referencias parciales despues de los resultados utiles.
        } finally {
            if (results != null) {
                try {
                    results.close();
                } catch (Exception ignored) {
                    // El contexto principal se cierra al terminar la operacion.
                }
            }
        }
    }

    private void collectCacheUsersByPrefix(LdapContext context, String prefix, LocalDateTime syncedAt,
                                           Map<String, AdUsuarioCache> usersBySam) throws Exception {
        List<AdUsuarioCache> users = searchCacheUsersFromAd(context, userSyncFilterForPrefix(prefix), syncedAt);
        if (users.size() >= LDAP_PAGE_SIZE && prefix.length() < LDAP_MAX_PREFIX_DEPTH) {
            for (char bucket : LDAP_BUCKET_CHARS.toCharArray()) {
                collectCacheUsersByPrefix(context, prefix + bucket, syncedAt, usersBySam);
            }
            return;
        }
        mergeCacheUsers(usersBySam, users);
    }

    private void collectCacheUsersForOtherPrefixes(LdapContext context, LocalDateTime syncedAt,
                                                   Map<String, AdUsuarioCache> usersBySam) throws Exception {
        StringBuilder excludedPrefixes = new StringBuilder();
        for (char bucket : LDAP_BUCKET_CHARS.toCharArray()) {
            excludedPrefixes.append("(sAMAccountName=").append(LdapFilterUtils.escape(String.valueOf(bucket))).append("*)");
        }
        String filter = "(&(objectCategory=person)(objectClass=user)(sAMAccountName=*)(!(|"
                + excludedPrefixes
                + ")))";
        mergeCacheUsers(usersBySam, searchCacheUsersFromAd(context, filter, syncedAt));
    }

    private List<AdUsuarioCache> searchCacheUsersFromAd(LdapContext context, String filter, LocalDateTime syncedAt) throws Exception {
        List<AdUsuarioCache> users = new ArrayList<>();
        byte[] cookie = null;
        SearchControls controls = controls(USER_ATTRIBUTES, 0);
        do {
            context.setRequestControls(new Control[]{new PagedResultsControl(LDAP_PAGE_SIZE, cookie, false)});
            NamingEnumeration<SearchResult> results = context.search(contextFactory.baseDn(), filter, controls);
            int pageCount = 0;
            try {
                while (results.hasMore()) {
                    users.add(toCache(results.next(), syncedAt));
                    pageCount++;
                }
            } catch (PartialResultException ignored) {
                jobStatus.incrementarProcesados(pageCount);
                break;
            }
            jobStatus.incrementarProcesados(pageCount);
            cookie = responseCookie(context);
        } while (cookie != null && cookie.length > 0);
        return users;
    }

    private void mergeCacheUsers(Map<String, AdUsuarioCache> target, List<AdUsuarioCache> users) {
        for (AdUsuarioCache user : users) {
            if (user.getSamAccountName() != null && !user.getSamAccountName().isBlank()) {
                target.put(user.getSamAccountName().toLowerCase(), user);
            }
        }
    }

    private String userSyncFilterForPrefix(String prefix) {
        return "(&(objectCategory=person)(objectClass=user)(sAMAccountName="
                + LdapFilterUtils.escape(prefix)
                + "*))";
    }

    private AdUser refreshCachedUserFromAd(String samAccountName) {
        DirContext context = null;
        try {
            context = contextFactory.openDirContext();
            SearchResult result = findUser(context, samAccountName, USER_ATTRIBUTES);
            if (result == null) {
                cacheRepository.findFirstBySamAccountNameIgnoreCase(samAccountName)
                        .ifPresent(cacheRepository::delete);
                return null;
            }
            AdUsuarioCache cache = toCache(result, LocalDateTime.now());
            cacheRepository.save(cache);
            return toUser(cache);
        } catch (Exception e) {
            log.warn("No se pudo refrescar cache AD para samAccountName={}", samAccountName, e);
            return cacheRepository.findFirstBySamAccountNameIgnoreCase(samAccountName)
                    .map(this::toUser)
                    .orElse(null);
        } finally {
            closeQuietly(context);
        }
    }

    private AdUser refreshCachedUserFromAd(String samAccountName, String distinguishedName) {
        if (distinguishedName == null || distinguishedName.isBlank()) {
            return refreshCachedUserFromAd(samAccountName);
        }
        DirContext context = null;
        try {
            context = contextFactory.openDirContext();
            Attributes attrs = context.getAttributes(distinguishedName, USER_ATTRIBUTES);
            AdUsuarioCache cache = toCache(attrs, distinguishedName, LocalDateTime.now());
            cacheRepository.save(cache);
            return toUser(cache);
        } catch (Exception e) {
            log.warn("No se pudo refrescar cache AD por DN para samAccountName={}", samAccountName, e);
            return refreshCachedUserFromAd(samAccountName);
        } finally {
            closeQuietly(context);
        }
    }

    private SearchResult findUserByCachedDn(DirContext context, String samAccountName, String[] returningAttributes) {
        if (cacheRepository == null || samAccountName == null || samAccountName.isBlank()) {
            return null;
        }
        try {
            return cacheRepository.findFirstBySamAccountNameIgnoreCase(samAccountName)
                    .map(AdUsuarioCache::getDistinguishedName)
                    .filter(dn -> dn != null && !dn.isBlank())
                    .map(dn -> {
                        try {
                            SearchResult result = new SearchResult("", null, context.getAttributes(dn, returningAttributes));
                            result.setNameInNamespace(dn);
                            return result;
                        } catch (Exception ignored) {
                            return null;
                        }
                    })
                    .orElse(null);
        } catch (RuntimeException ignored) {
            return null;
        }
    }

    private List<ActiveDirectoryGroup> searchGroups(String filter, int limit) {
        List<ActiveDirectoryGroup> groups = new ArrayList<>();
        DirContext context = null;
        try {
            context = contextFactory.openDirContext();
            SearchControls controls = controls(new String[]{"cn", "distinguishedName", "description"}, limit);
            NamingEnumeration<SearchResult> results = context.search(contextFactory.baseDn(), filter, controls);
            while (results.hasMore()) {
                SearchResult result = results.next();
                groups.add(new ActiveDirectoryGroup(
                        attr(result.getAttributes(), "cn"),
                        result.getNameInNamespace(),
                        attr(result.getAttributes(), "description")
                ));
            }
        } catch (PartialResultException ignored) {
            return groups;
        } catch (Exception ignored) {
            return List.of();
        } finally {
            closeQuietly(context);
        }
        return groups;
    }

    private int countPaged(String filter) {
        int total = 0;
        LdapContext context = null;
        try {
            context = contextFactory.openLdapContext();
            byte[] cookie = null;
            SearchControls controls = controls(new String[]{"distinguishedName"}, 0);
            do {
                context.setRequestControls(new Control[]{new PagedResultsControl(LDAP_PAGE_SIZE, cookie, false)});
                NamingEnumeration<SearchResult> results = context.search(contextFactory.baseDn(), filter, controls);
                while (results.hasMore()) {
                    results.next();
                    total++;
                }
                cookie = null;
                Control[] responseControls = context.getResponseControls();
                if (responseControls != null) {
                    for (Control control : responseControls) {
                        if (control instanceof PagedResultsResponseControl paged) {
                            cookie = paged.getCookie();
                        }
                    }
                }
            } while (cookie != null && cookie.length > 0);
        } catch (Exception ignored) {
            return total;
        } finally {
            closeQuietly(context);
        }
        return total;
    }

    private byte[] responseCookie(LdapContext context) throws Exception {
        Control[] responseControls = context.getResponseControls();
        if (responseControls != null) {
            for (Control control : responseControls) {
                if (control instanceof PagedResultsResponseControl paged) {
                    return paged.getCookie();
                }
            }
        }
        return null;
    }

    private AdUser toUser(SearchResult result) throws Exception {
        Attributes attrs = result.getAttributes();
        return new AdUser(
                attr(attrs, "sAMAccountName"),
                attr(attrs, "displayName"),
                attr(attrs, "givenName"),
                attr(attrs, "sn"),
                attr(attrs, "mail"),
                attr(attrs, "department"),
                attr(attrs, "company"),
                attr(attrs, "title"),
                attr(attrs, "telephoneNumber"),
                attr(attrs, "mobile"),
                attr(attrs, "physicalDeliveryOfficeName"),
                attr(attrs, "description"),
                result.getNameInNamespace(),
                attr(attrs, "userPrincipalName"),
                (parseInt(attr(attrs, "userAccountControl")) & ACCOUNT_DISABLED) == 0,
                parseLong(attr(attrs, "lockoutTime")) > 0,
                extractOus(result.getNameInNamespace()),
                formatAdDate(attr(attrs, "whenCreated")),
                formatAdDate(attr(attrs, "whenChanged")),
                fileTimeToDate(attr(attrs, "pwdLastSet")),
                fileTimeToDate(attr(attrs, "lastLogonTimestamp")),
                accountExpiresToDate(attr(attrs, "accountExpires")),
                attr(attrs, "badPwdCount"),
                daysSinceFileTime(attr(attrs, "pwdLastSet")),
                groups(attrs)
        );
    }

    private AdUserSummary toUserSummary(AdUsuarioCache user) {
        return new AdUserSummary(
                user.getSamAccountName(),
                user.getDisplayName(),
                user.getMail(),
                user.getOffice(),
                user.getOrganizationalUnit(),
                user.isEnabled(),
                user.isLocked()
        );
    }

    private AdUsuarioCache toCache(SearchResult result, LocalDateTime syncedAt) throws Exception {
        return toCache(result.getAttributes(), result.getNameInNamespace(), syncedAt);
    }

    private AdUsuarioCache toCache(Attributes attrs, String distinguishedName, LocalDateTime syncedAt) throws Exception {
        long lockoutTime = parseLong(attr(attrs, "lockoutTime"));
        AdUsuarioCache cache = new AdUsuarioCache();
        cache.setSamAccountName(attr(attrs, "sAMAccountName"));
        cache.setDisplayName(attr(attrs, "displayName"));
        cache.setGivenName(attr(attrs, "givenName"));
        cache.setSurname(attr(attrs, "sn"));
        cache.setMail(attr(attrs, "mail"));
        cache.setDepartment(attr(attrs, "department"));
        cache.setCompany(attr(attrs, "company"));
        cache.setTitle(attr(attrs, "title"));
        cache.setTelephoneNumber(attr(attrs, "telephoneNumber"));
        cache.setMobile(attr(attrs, "mobile"));
        cache.setOffice(attr(attrs, "physicalDeliveryOfficeName"));
        cache.setDescription(attr(attrs, "description"));
        cache.setDistinguishedName(distinguishedName);
        cache.setUserPrincipalName(attr(attrs, "userPrincipalName"));
        cache.setEnabled((parseInt(attr(attrs, "userAccountControl")) & ACCOUNT_DISABLED) == 0);
        cache.setLocked(lockoutTime > 0);
        cache.setOrganizationalUnit(extractOus(distinguishedName));
        cache.setWhenCreated(formatAdDate(attr(attrs, "whenCreated")));
        cache.setWhenChanged(formatAdDate(attr(attrs, "whenChanged")));
        cache.setPwdLastSet(fileTimeToDate(attr(attrs, "pwdLastSet")));
        cache.setLastLogonTimestamp(fileTimeToDate(attr(attrs, "lastLogonTimestamp")));
        cache.setAccountExpires(accountExpiresToDate(attr(attrs, "accountExpires")));
        cache.setBadPwdCount(attr(attrs, "badPwdCount"));
        cache.setDaysSincePasswordChange(daysSinceFileTime(attr(attrs, "pwdLastSet")));
        cache.setDaysSinceLastLogon(daysSinceFileTime(attr(attrs, "lastLogonTimestamp")));
        cache.setLockoutTime(lockoutTime);
        cache.setGroupsText(String.join("\n", groups(attrs)));
        cache.setSyncedAt(syncedAt);
        return cache;
    }

    private AdUser toUser(AdUsuarioCache user) {
        return new AdUser(
                user.getSamAccountName(),
                user.getDisplayName(),
                user.getGivenName(),
                user.getSurname(),
                user.getMail(),
                user.getDepartment(),
                user.getCompany(),
                user.getTitle(),
                user.getTelephoneNumber(),
                user.getMobile(),
                user.getOffice(),
                user.getDescription(),
                user.getDistinguishedName(),
                user.getUserPrincipalName(),
                user.isEnabled(),
                user.isLocked(),
                user.getOrganizationalUnit(),
                user.getWhenCreated(),
                user.getWhenChanged(),
                user.getPwdLastSet(),
                user.getLastLogonTimestamp(),
                user.getAccountExpires(),
                user.getBadPwdCount(),
                user.getDaysSincePasswordChange(),
                groups(user.getGroupsText())
        );
    }

    private AdUserSummary toUserSummary(AdUser user) {
        return new AdUserSummary(
                user.samAccountName(),
                user.displayName(),
                user.mail(),
                user.office(),
                user.organizationalUnit(),
                user.enabled(),
                user.locked()
        );
    }

    private List<AdUserAlerta> topAlerts(List<AdUsuarioCache> rows, String suffix, AlertDaysExtractor extractor) {
        return rows.stream()
                .limit(10)
                .map(row -> new AdUserAlerta(row.getSamAccountName(), row.getDisplayName(), extractor.days(row) + " " + suffix))
                .toList();
    }

    private List<AdUserAlerta> contratoAlerts(List<UsuarioRedContrato> contratos, LocalDate hoy) {
        return contratos.stream()
                .limit(10)
                .map(contrato -> {
                    String titular = ((contrato.getPersonalNombre() == null ? "" : contrato.getPersonalNombre().trim())
                            + " "
                            + (contrato.getPersonalApellidos() == null ? "" : contrato.getPersonalApellidos().trim())).trim();
                    long dias = java.time.temporal.ChronoUnit.DAYS.between(hoy, contrato.getFechaFin());
                    String plazo = dias == 0 ? "vence hoy" : dias == 1 ? "vence mañana" : "vence en " + dias + " días";
                    String numero = blankToDefault(contrato.getNumeroContrato(), "Sin número de contrato");
                    String fecha = contrato.getFechaFin().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"));
                    return new AdUserAlerta(
                            contrato.getUsuario(),
                            blankToDefault(titular, contrato.getUsuario()),
                            numero + " · " + plazo + " · " + fecha
                    );
                })
                .toList();
    }

    private ActiveDirectoryDashboardCompleto emptyDashboardCompleto() {
        return new ActiveDirectoryDashboardCompleto(
                0, 0, 0, 0,
                List.of(), List.of(),
                List.of(), 0,
                List.of(), 0,
                List.of(), 0,
                List.of(), 0
        );
    }

    private String blankToDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String lockoutDetail(Long lockoutTime) {
        if (lockoutTime == null || lockoutTime <= 0) {
            return "Cuenta bloqueada";
        }
        String date = fileTimeToDate(String.valueOf(lockoutTime));
        return date == null ? "Cuenta bloqueada" : "Bloqueada desde " + date;
    }

    private SearchControls controls(String[] attrs, int limit) {
        SearchControls controls = new SearchControls();
        controls.setSearchScope(SearchControls.SUBTREE_SCOPE);
        controls.setReturningAttributes(attrs);
        controls.setCountLimit(limit);
        return controls;
    }

    private void addReplace(List<ModificationItem> mods, String attribute, String value) {
        if (value != null && !value.trim().isEmpty()) {
            mods.add(new ModificationItem(DirContext.REPLACE_ATTRIBUTE, new BasicAttribute(attribute, value.trim())));
        }
    }

    private void addReplaceOrRemove(List<ModificationItem> mods, String attribute, String value) {
        BasicAttribute replacement = value == null || value.isBlank()
                ? new BasicAttribute(attribute)
                : new BasicAttribute(attribute, value.trim());
        mods.add(new ModificationItem(DirContext.REPLACE_ATTRIBUTE, replacement));
    }

    private void putIfPresent(BasicAttributes attrs, String attribute, String value) {
        if (value != null && !value.trim().isEmpty()) {
            attrs.put(attribute, value.trim());
        }
    }

    private void validateTargetOu(String targetOu) {
        if (targetOu == null || targetOu.isBlank()) {
            throw new IllegalArgumentException("Selecciona una OU destino.");
        }
        if (!targetOu.toLowerCase().endsWith(contextFactory.baseDn().toLowerCase())) {
            throw new IllegalArgumentException("La OU destino debe pertenecer a " + contextFactory.baseDn());
        }
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.trim().isEmpty()) {
                return value.trim();
            }
        }
        return "";
    }

    private String domainFromBaseDn() {
        String domain = java.util.Arrays.stream(contextFactory.baseDn().split(","))
                .map(String::trim)
                .filter(part -> part.regionMatches(true, 0, "DC=", 0, 3))
                .map(part -> part.substring(3))
                .filter(part -> !part.isBlank())
                .collect(Collectors.joining("."));
        return domain.isBlank() ? "local" : domain;
    }

    private void destroyCreatedUserQuietly(DirContext context, String userDn) {
        try {
            context.destroySubcontext(userDn);
        } catch (Exception cleanupError) {
            log.warn("No se pudo revertir usuario AD creado parcialmente: {}", userDn, cleanupError);
        }
    }

    private String attr(Attributes attrs, String name) throws Exception {
        Attribute attribute = attrs == null ? null : attrs.get(name);
        return attribute == null || attribute.get() == null ? null : attribute.get().toString();
    }

    private List<String> groups(Attributes attrs) throws Exception {
        Attribute memberOf = attrs.get("memberOf");
        if (memberOf == null) {
            return List.of();
        }
        List<String> values = new ArrayList<>();
        NamingEnumeration<?> all = memberOf.getAll();
        while (all.hasMore()) {
            values.add(extractCn(all.next().toString()));
        }
        return values;
    }

    private List<String> groups(String groupsText) {
        if (groupsText == null || groupsText.isBlank()) {
            return List.of();
        }
        return groupsText.lines()
                .filter(line -> !line.isBlank())
                .toList();
    }

    private int metadataInt(String key) {
        return metadataRepository.findById(key)
                .map(AdCacheMetadata::getValor)
                .map(this::parseInt)
                .orElse(0);
    }

    private int safeInt(long value) {
        return value > Integer.MAX_VALUE ? Integer.MAX_VALUE : (int) value;
    }

    private String extractOus(String dn) {
        if (dn == null) {
            return null;
        }
        List<String> ous = new ArrayList<>();
        for (String part : dn.split(",")) {
            if (part.trim().toUpperCase().startsWith("OU=")) {
                ous.add(part.trim().substring(3));
            }
        }
        return String.join(" / ", ous);
    }

    private String extractCn(String dn) {
        if (dn == null) {
            return "";
        }
        for (String part : dn.split(",")) {
            if (part.trim().toUpperCase().startsWith("CN=")) {
                return part.trim().substring(3);
            }
        }
        return dn;
    }

    private String dnFirstSegment(String dn) {
        int comma = dn == null ? -1 : dn.indexOf(',');
        return comma > 0 ? dn.substring(0, comma) : dn;
    }

    private String fileTimeToDate(String value) {
        if (value == null || value.equals("0")) {
            return null;
        }
        try {
            long millis = (Long.parseLong(value) / 10000L) - 11644473600000L;
            return LocalDateTime.ofInstant(Instant.ofEpochMilli(millis), ZoneId.systemDefault())
                    .format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
        } catch (Exception e) {
            return null;
        }
    }

    private String accountExpiresToDate(String value) {
        if (value == null || value.equals("0") || value.equals("9223372036854775807")) {
            return "Nunca";
        }
        return fileTimeToDate(value);
    }

    private String formatAdDate(String value) {
        if (value == null || value.length() < 14) {
            return null;
        }
        try {
            return LocalDateTime.parse(value.substring(0, 14), DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                    .format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
        } catch (Exception e) {
            return value;
        }
    }

    private Long daysSinceFileTime(String value) {
        if (value == null || value.equals("0")) {
            return null;
        }
        try {
            long millis = (Long.parseLong(value) / 10000L) - 11644473600000L;
            LocalDateTime date = LocalDateTime.ofInstant(Instant.ofEpochMilli(millis), ZoneId.systemDefault());
            return Duration.between(date, LocalDateTime.now()).toDays();
        } catch (Exception e) {
            return null;
        }
    }

    private int parseInt(String value) {
        try {
            return value == null ? 0 : Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private long parseLong(String value) {
        try {
            return value == null ? 0 : Long.parseLong(value);
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private void audit(String action, String samAccountName, String dn, int status, String detail) {
        try {
            auditoriaService.registrar(currentUsername(), action, "usuarios-red", "POST",
                    request.getRequestURI(), dn == null ? samAccountName : dn, status, clientIp(), detail);
        } catch (RuntimeException ignored) {
        }
    }

    private void auditAd(String action, String samAccountName, String userDn, String resultado, String mensaje,
                          String estadoAnterior, String estadoNuevo, String detalleExitoOError,
                          UUID idTransaccion, Instant inicio) {
        LocalDateTime fechaInicio = LocalDateTime.ofInstant(inicio, ZoneId.systemDefault());
        LocalDateTime fechaFin = LocalDateTime.now();
        adAuditoriaService.registrar(new AdAuditoriaRegistro(
                currentUsername(), null, samAccountName, userDn, action, resultado, mensaje, detalleExitoOError,
                estadoAnterior, estadoNuevo, samAccountName, request.getRequestURI(), request.getMethod(),
                clientIp(), request.getHeader("User-Agent"), idTransaccion, fechaInicio, fechaFin));
    }

    String describirCambiosInfo(Attributes antes, UpdateUserInfoRequest body) throws Exception {
        List<String> cambios = new ArrayList<>();
        agregarCambio(cambios, "Nombre para mostrar", attr(antes, "displayName"), body.displayName());
        agregarCambio(cambios, "Cargo", attr(antes, "title"), body.title());
        agregarCambio(cambios, "Departamento", attr(antes, "department"), body.department());
        agregarCambio(cambios, "Oficina", attr(antes, "physicalDeliveryOfficeName"), body.office());
        agregarCambio(cambios, "Telefono", attr(antes, "telephoneNumber"), body.telephoneNumber());
        agregarCambio(cambios, "Celular", attr(antes, "mobile"), body.mobile());
        if (body.clearMail()) {
            String mailAntes = blankToNull(attr(antes, "mail"));
            if (mailAntes != null) {
                cambios.add("Correo: " + mailAntes + " -> (eliminado)");
            }
        } else {
            agregarCambio(cambios, "Correo", attr(antes, "mail"), body.mail());
        }
        agregarCambio(cambios, "Descripcion", attr(antes, "description"), body.description());
        return cambios.isEmpty() ? null : "Campos actualizados: " + String.join(", ", cambios);
    }

    private void agregarCambio(List<String> cambios, String etiqueta, String antes, String nuevoValor) {
        if (nuevoValor == null || nuevoValor.isBlank()) {
            return;
        }
        String nuevo = nuevoValor.trim();
        String antesNorm = blankToNull(antes);
        if (!nuevo.equals(antesNorm)) {
            cambios.add(etiqueta + ": " + (antesNorm == null ? "(vacio)" : antesNorm) + " -> " + nuevo);
        }
    }

    private record AdAuditoriaDetalle(String estadoAnterior, String estadoNuevo, String detalleExito) {
    }

    private void closeQuietly(javax.naming.Context context) {
        if (context == null) {
            return;
        }
        try {
            context.close();
        } catch (Exception ignored) {
        }
    }

    private String currentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication == null || authentication.getName() == null ? "sistema" : authentication.getName();
    }

    private String clientIp() {
        String forwarded = request.getHeader("X-Forwarded-For");
        return forwarded == null || forwarded.isBlank() ? request.getRemoteAddr() : forwarded.split(",")[0].trim();
    }

    @FunctionalInterface
    private interface UserWriteOperation {
        AdAuditoriaDetalle apply(DirContext context, String userDn, SearchResult result) throws Exception;
    }

    @FunctionalInterface
    private interface AlertDaysExtractor {
        Long days(AdUsuarioCache row);
    }

    record SearchStateFilter(Boolean enabled, Boolean locked) {
        static SearchStateFilter from(String estado) {
            if (estado == null || estado.isBlank()) {
                return new SearchStateFilter(null, null);
            }
            return switch (estado.trim().toLowerCase()) {
                case "enabled", "habilitados", "habilitado" -> new SearchStateFilter(true, null);
                case "disabled", "deshabilitados", "deshabilitado" -> new SearchStateFilter(false, null);
                case "locked", "bloqueados", "bloqueado" -> new SearchStateFilter(null, true);
                default -> new SearchStateFilter(null, null);
            };
        }

        boolean isAll() {
            return enabled == null && locked == null;
        }
    }

    record DashboardUserRow(
            String samAccountName,
            String displayName,
            boolean enabled,
            boolean locked,
            long lockoutTime,
            Long daysSincePasswordChange,
            Long daysSinceLastLogon,
            String organizationalUnit
    ) {
    }
}
