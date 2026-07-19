package com.inia.soportedesk.activedirectory;

import com.inia.soportedesk.activedirectory.dto.CorreoDisponible;
import com.inia.soportedesk.gestiontiinia.VwGwDashboard;
import com.inia.soportedesk.gestiontiinia.VwGwDashboardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CorreoVinculacionService {

    private final VwGwDashboardRepository correoRepository;
    private final AdUsuarioCacheRepository adUsuarioCacheRepository;

    public List<CorreoDisponible> listarDisponibles(String samAccountName) {
        Set<String> correosVinculados = new HashSet<>(adUsuarioCacheRepository.findAllMailAddresses());
        if (samAccountName != null && !samAccountName.isBlank()) {
            adUsuarioCacheRepository.findFirstBySamAccountNameIgnoreCase(samAccountName.trim())
                    .map(AdUsuarioCache::getMail)
                    .filter(mail -> mail != null && !mail.isBlank())
                    .map(this::normalize)
                    .ifPresent(correosVinculados::remove);
        }
        return correoRepository.findAll().stream()
                .filter(correo -> correo.getEmail() != null && !correo.getEmail().isBlank())
                .filter(correo -> !correosVinculados.contains(normalize(correo.getEmail())))
                .sorted(Comparator.comparing(VwGwDashboard::getEmail, String.CASE_INSENSITIVE_ORDER))
                .map(correo -> new CorreoDisponible(
                        correo.getEmail().trim(),
                        blankToNull(correo.getNombreCompleto()),
                        blankToNull(correo.getEstado())))
                .toList();
    }

    public void validarParaNuevoUsuario(String mail) {
        String correo = mail == null ? "" : mail.trim();
        if (correo.isBlank()) {
            return;
        }
        validarCorreoRegistrado(correo);
        if (adUsuarioCacheRepository.existsByMailIgnoreCase(correo)) {
            throw new IllegalArgumentException("El correo seleccionado ya esta vinculado a otro usuario de red.");
        }
    }

    public void validarParaActualizacion(String samAccountName, String mail) {
        String correo = mail == null ? "" : mail.trim();
        if (correo.isBlank()) {
            return;
        }

        AdUsuarioCache usuarioActual = adUsuarioCacheRepository
                .findFirstBySamAccountNameIgnoreCase(samAccountName)
                .orElse(null);
        if (usuarioActual != null && usuarioActual.getMail() != null
                && usuarioActual.getMail().trim().equalsIgnoreCase(correo)) {
            return;
        }

        validarCorreoRegistrado(correo);
        adUsuarioCacheRepository.findFirstByMailIgnoreCase(correo)
                .filter(propietario -> !propietario.getSamAccountName().equalsIgnoreCase(samAccountName))
                .ifPresent(propietario -> {
                    throw new IllegalArgumentException("El correo seleccionado ya esta vinculado a otro usuario de red.");
                });
    }

    private void validarCorreoRegistrado(String correo) {
        if (!correoRepository.existsByEmailIgnoreCase(correo)) {
            throw new IllegalArgumentException("Selecciona un correo existente en el modulo de Correos.");
        }
    }

    private String normalize(String value) {
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
