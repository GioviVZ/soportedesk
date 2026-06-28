package com.inia.soportedesk.impresoras;

import com.inia.soportedesk.catalogo.MarcaImpresora;
import com.inia.soportedesk.catalogo.MarcaImpresoraRepository;
import com.inia.soportedesk.catalogo.ModeloImpresora;
import com.inia.soportedesk.catalogo.ModeloImpresoraRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class ImpresoraRepositoryTest {

    @Autowired
    private ImpresoraRepository repository;

    @Autowired
    private MarcaImpresoraRepository marcaImpresoraRepository;

    @Autowired
    private ModeloImpresoraRepository modeloImpresoraRepository;

    private ModeloImpresora modeloImpresora(String marcaNombre, String modeloNombre) {
        MarcaImpresora marca = new MarcaImpresora();
        marca.setNombre(marcaNombre);
        marca = marcaImpresoraRepository.save(marca);

        ModeloImpresora modelo = new ModeloImpresora();
        modelo.setMarca(marca);
        modelo.setNombre(modeloNombre);
        return modeloImpresoraRepository.save(modelo);
    }

    @Test
    void search_bySerie_returnsMatchingImpresora() {
        Impresora impresora = new Impresora();
        impresora.setModeloImpresora(modeloImpresora("HP", "M404dn"));
        impresora.setTipoConexion("USB");
        impresora.setEstado("Activa");
        impresora.setSerie("SN-99887");
        repository.save(impresora);

        List<Impresora> result = repository.search("SN-99887");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getSerie()).isEqualTo("SN-99887");
    }

    @Test
    void search_byCodigoInventario_returnsMatchingImpresora() {
        Impresora impresora = new Impresora();
        impresora.setModeloImpresora(modeloImpresora("Canon", "LBP6230"));
        impresora.setTipoConexion("USB");
        impresora.setEstado("Activa");
        impresora.setCodigoInventario("INV-7766");
        repository.save(impresora);

        List<Impresora> result = repository.search("INV-7766");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getCodigoInventario()).isEqualTo("INV-7766");
    }

    @Test
    void search_byModeloNombre_returnsMatchingImpresora() {
        Impresora impresora = new Impresora();
        impresora.setModeloImpresora(modeloImpresora("Epson", "L3250"));
        impresora.setTipoConexion("USB");
        impresora.setEstado("Activa");
        repository.save(impresora);

        List<Impresora> result = repository.search("L3250");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getModeloImpresora().getNombre()).isEqualTo("L3250");
    }

    @Test
    void search_byMarcaNombre_returnsMatchingImpresora() {
        Impresora impresora = new Impresora();
        impresora.setModeloImpresora(modeloImpresora("Brother", "HL-L2350DW"));
        impresora.setTipoConexion("USB");
        impresora.setEstado("Activa");
        repository.save(impresora);

        List<Impresora> result = repository.search("Brother");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getModeloImpresora().getMarca().getNombre()).isEqualTo("Brother");
    }
}
