package com.inia.soportedesk;

import com.tngtech.archunit.core.domain.JavaClass;
import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.library.dependencies.SliceAssignment;
import com.tngtech.archunit.library.dependencies.SliceIdentifier;

import java.util.Map;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.library.dependencies.SlicesRuleDefinition.slices;

@AnalyzeClasses(
        packages = "com.inia.soportedesk",
        importOptions = ImportOption.DoNotIncludeTests.class
)
class ArchitectureTest {

    private static final Map<String, String> MAVEN_MODULE_BY_TOP_LEVEL_PACKAGE = Map.ofEntries(
            Map.entry("common", "common"),
            Map.entry("exception", "common"),
            Map.entry("catalogo", "catalogo"),
            Map.entry("gestiontiinia", "gestiontiinia"),
            Map.entry("realtime", "realtime"),
            Map.entry("auditoria", "auditoria"),
            Map.entry("wifi", "wifi"),
            Map.entry("auth", "identity"),
            Map.entry("security", "identity"),
            Map.entry("equipos", "equipos"),
            Map.entry("glpi", "equipos"),
            Map.entry("impresoras", "impresoras"),
            Map.entry("equiposred", "equipos-red"),
            Map.entry("equiposmoviles", "equipos-moviles"),
            Map.entry("licencias", "licencias"),
            Map.entry("correos", "correos"),
            Map.entry("activedirectory", "red-directorio"),
            Map.entry("usuariosred", "red-directorio"),
            Map.entry("herramientas", "herramientas"),
            Map.entry("vpn", "vpn"),
            Map.entry("dashboard", "dashboard"),
            Map.entry("config", "app")
    );

    private static final SliceAssignment MAVEN_MODULE_ASSIGNMENT = new SliceAssignment() {
        @Override
        public SliceIdentifier getIdentifierOf(JavaClass javaClass) {
            String packageName = javaClass.getPackageName();
            if (packageName.equals("com.inia.soportedesk")) {
                return SliceIdentifier.of("app");
            }

            String packagePrefix = "com.inia.soportedesk.";
            if (!packageName.startsWith(packagePrefix)) {
                return SliceIdentifier.ignore();
            }

            String relativePackage = packageName.substring(packagePrefix.length());
            String topLevelPackage = relativePackage.split("\\.", 2)[0];
            String moduleName = MAVEN_MODULE_BY_TOP_LEVEL_PACKAGE.get(topLevelPackage);
            return moduleName != null ? SliceIdentifier.of(moduleName) : SliceIdentifier.ignore();
        }

        @Override
        public String getDescription() {
            return "Maven modules";
        }
    };

    @ArchTest
    static void top_level_domain_packages_should_be_free_of_cycles(JavaClasses classes) {
        slices()
                .assignedFrom(MAVEN_MODULE_ASSIGNMENT)
                .should().beFreeOfCycles()
                .check(classes);
    }

    @ArchTest
    static void only_equipos_should_access_glpi(JavaClasses classes) {
        noClasses()
                .that().resideOutsideOfPackages(
                        "com.inia.soportedesk.equipos..",
                        "com.inia.soportedesk.glpi.."
                )
                .should().dependOnClassesThat().resideInAPackage("com.inia.soportedesk.glpi..")
                .check(classes);
    }
}
