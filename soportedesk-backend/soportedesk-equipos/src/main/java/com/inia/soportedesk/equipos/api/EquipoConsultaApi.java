package com.inia.soportedesk.equipos.api;

import com.inia.soportedesk.glpi.VwInvComputerFull;
import com.inia.soportedesk.glpi.VwInvComputerFullRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class EquipoConsultaApi {

    private final VwInvComputerFullRepository repository;

    public Optional<EquipoConsultaDto> buscarPorId(Long computerId) {
        return repository.findById(computerId).map(this::toDto);
    }

    public List<EquipoConsultaDto> buscarPorHostOIp(String referencia) {
        return repository.findByHostOrIp(referencia).stream()
                .map(this::toDto)
                .toList();
    }

    public List<EquipoConsultaDto> listarTodos() {
        return repository.findFiltered(null, null, null, null, null, null).stream()
                .map(this::toDto)
                .toList();
    }

    private EquipoConsultaDto toDto(VwInvComputerFull equipo) {
        return new EquipoConsultaDto(
                equipo.getComputerID(),
                equipo.getNombreEquipo(),
                equipo.getIpEquipo(),
                equipo.getModeloEquipo(),
                equipo.getNumeroserie(),
                equipo.getFabricanteEquipo(),
                equipo.getTipoEquipo(),
                equipo.getSedeNombre(),
                equipo.getSedeNombreCompleto(),
                equipo.getUsuarioContacto());
    }
}
