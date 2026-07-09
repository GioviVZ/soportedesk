package com.inia.soportedesk.activedirectory;

import com.inia.soportedesk.activedirectory.config.LdapContextFactory;
import com.inia.soportedesk.activedirectory.dto.ActiveDirectoryDashboard;
import com.inia.soportedesk.activedirectory.dto.ActiveDirectoryDashboardCompleto;
import com.inia.soportedesk.activedirectory.dto.ActiveDirectoryGroup;
import com.inia.soportedesk.activedirectory.dto.ActiveDirectoryOu;
import com.inia.soportedesk.activedirectory.dto.ActiveDirectoryResponse;
import com.inia.soportedesk.activedirectory.dto.AdUserAlerta;
import com.inia.soportedesk.activedirectory.dto.AdUserSearchResult;
import com.inia.soportedesk.activedirectory.dto.AdUserSummary;
import com.inia.soportedesk.activedirectory.dto.AdUser;
import com.inia.soportedesk.activedirectory.dto.GroupRequest;
import com.inia.soportedesk.activedirectory.dto.MoveUserRequest;
import com.inia.soportedesk.activedirectory.dto.OuUsuariosCount;
import com.inia.soportedesk.activedirectory.dto.ResetPasswordRequest;
import com.inia.soportedesk.activedirectory.dto.UpdateUserInfoRequest;
import com.inia.soportedesk.auditoria.MovimientoAuditoriaService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import javax.naming.NamingEnumeration;
import javax.naming.PartialResultException;
import javax.naming.directory.AttributeInUseException;
import javax.naming.directory.Attribute;
import javax.naming.directory.Attributes;
import javax.naming.directory.BasicAttribute;
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
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ActiveDirectoryService {
    private static final Logger log = LoggerFactory.getLogger(ActiveDirectoryService.class);
    private static final int ACCOUNT_DISABLED = 0x0002;
    private static final int PASSWORD_EXPIRED_DAYS = 90;
    private static final int INACTIVE_ACCOUNT_DAYS = 60;
    private static final String LDAP_MATCHING_RULE_BIT_AND = "1.2.840.113556.1.4.803";
    private static final String[] USER_ATTRIBUTES = {
            "sAMAccountName", "displayName", "givenName", "sn", "mail", "department", "company", "title",
            "telephoneNumber", "mobile", "physicalDeliveryOfficeName", "description", "distinguishedName",
            "userPrincipalName", "userAccountControl", "memberOf", "whenCreated", "whenChanged", "pwdLastSet",
            "lastLogonTimestamp", "accountExpires", "badPwdCount", "lockoutTime"
    };

    private final LdapContextFactory contextFactory;
    private final MovimientoAuditoriaService auditoriaService;
    private final HttpServletRequest request;

    public AdUserSearchResult buscarUsuarios(String usuario, String nombre, String oficina) {
        if (!hasSearchTerm(usuario) && !hasSearchTerm(nombre) && !hasSearchTerm(oficina)) {
            return new AdUserSearchResult(List.of(), false);
        }
        List<AdUserSummary> users = new ArrayList<>();
        DirContext context = null;
        try {
            context = contextFactory.openDirContext();
            SearchControls controls = controls(new String[]{
                    "sAMAccountName", "displayName", "mail", "physicalDeliveryOfficeName",
                    "distinguishedName", "userAccountControl", "lockoutTime"
            }, 50);
            NamingEnumeration<SearchResult> results = context.search(
                    contextFactory.baseDn(),
                    buildUserSearchFilter(usuario, nombre, oficina),
                    controls
            );
            while (results.hasMore()) {
                users.add(toUserSummary(results.next()));
            }
            return new AdUserSearchResult(users, users.size() >= 50);
        } catch (PartialResultException ignored) {
            return new AdUserSearchResult(users, users.size() >= 50);
        } catch (Exception e) {
            log.warn("Error buscando usuarios en Active Directory", e);
            return new AdUserSearchResult(List.of(), false);
        } finally {
            closeQuietly(context);
        }
    }

    public ActiveDirectoryResponse<AdUser> buscarUsuarioPorSam(String samAccountName) {
        DirContext context = null;
        try {
            context = contextFactory.openDirContext();
            SearchResult result = findUser(context, samAccountName, USER_ATTRIBUTES);
            if (result == null) {
                return ActiveDirectoryResponse.error("Usuario no encontrado.");
            }
            return ActiveDirectoryResponse.ok("Usuario encontrado correctamente.", toUser(result));
        } catch (Exception e) {
            log.warn("Error consultando Active Directory para samAccountName={}", samAccountName, e);
            return ActiveDirectoryResponse.error("Error consultando Active Directory: " + e.getMessage());
        } finally {
            closeQuietly(context);
        }
    }

    public ActiveDirectoryResponse<AdUser> desbloquearUsuario(String samAccountName) {
        return withUserWrite(samAccountName, "DESBLOQUEAR_CUENTA", "Cuenta desbloqueada correctamente.", (context, userDn, result) ->
                context.modifyAttributes(userDn, new ModificationItem[]{
                        new ModificationItem(DirContext.REPLACE_ATTRIBUTE, new BasicAttribute("lockoutTime", "0"))
                })
        );
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
        });
    }

    public ActiveDirectoryResponse<AdUser> deshabilitarUsuario(String samAccountName) {
        return changeEnabled(samAccountName, false);
    }

    public ActiveDirectoryResponse<AdUser> habilitarUsuario(String samAccountName) {
        return changeEnabled(samAccountName, true);
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
            context.rename(new LdapName(userDn), new LdapName(cn + "," + targetOu));
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

    public ActiveDirectoryResponse<AdUser> actualizarInformacionUsuario(String samAccountName, UpdateUserInfoRequest body) {
        return withUserWrite(samAccountName, "ACTUALIZAR_INFO", "Informacion del usuario actualizada correctamente.", (context, userDn, result) -> {
            List<ModificationItem> mods = new ArrayList<>();
            addReplace(mods, "displayName", body.displayName());
            addReplace(mods, "title", body.title());
            addReplace(mods, "department", body.department());
            addReplace(mods, "physicalDeliveryOfficeName", body.office());
            addReplace(mods, "telephoneNumber", body.telephoneNumber());
            addReplace(mods, "mobile", body.mobile());
            addReplace(mods, "mail", body.mail());
            addReplace(mods, "description", body.description());
            if (mods.isEmpty()) {
                throw new IllegalArgumentException("No hay informacion para actualizar.");
            }
            context.modifyAttributes(userDn, mods.toArray(ModificationItem[]::new));
        });
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
        int enabled = countPaged("(&(objectCategory=person)(objectClass=user)(sAMAccountName=*)(!(userAccountControl:" + LDAP_MATCHING_RULE_BIT_AND + ":=2)))");
        int disabled = countPaged("(&(objectCategory=person)(objectClass=user)(sAMAccountName=*)(userAccountControl:" + LDAP_MATCHING_RULE_BIT_AND + ":=2))");
        int locked = countPaged("(&(objectCategory=person)(objectClass=user)(sAMAccountName=*)(lockoutTime>=1))");
        int dcs = countPaged("(&(objectCategory=computer)(userAccountControl:" + LDAP_MATCHING_RULE_BIT_AND + ":=8192))");
        return new ActiveDirectoryDashboard(enabled, locked, disabled, dcs);
    }

    public ActiveDirectoryDashboardCompleto obtenerDashboardCompleto() {
        try {
            List<DashboardUserRow> users = collectDashboardUsers();
            int enabled = (int) users.stream().filter(DashboardUserRow::enabled).count();
            int disabled = users.size() - enabled;
            int locked = (int) users.stream().filter(DashboardUserRow::locked).count();
            int dcs = countPaged("(&(objectCategory=computer)(userAccountControl:" + LDAP_MATCHING_RULE_BIT_AND + ":=8192))");

            List<OuUsuariosCount> ous = users.stream()
                    .filter(DashboardUserRow::enabled)
                    .collect(Collectors.groupingBy(row -> blankToDefault(row.organizationalUnit(), "Sin OU"), HashMap::new, Collectors.counting()))
                    .entrySet()
                    .stream()
                    .sorted(Map.Entry.<String, Long>comparingByValue(Comparator.reverseOrder()).thenComparing(Map.Entry.comparingByKey()))
                    .map(entry -> new OuUsuariosCount(entry.getKey(), entry.getValue().intValue()))
                    .toList();

            List<DashboardUserRow> passwords = users.stream()
                    .filter(row -> row.daysSincePasswordChange() != null && row.daysSincePasswordChange() > PASSWORD_EXPIRED_DAYS)
                    .sorted(Comparator.comparing(DashboardUserRow::daysSincePasswordChange, Comparator.reverseOrder()))
                    .toList();

            List<DashboardUserRow> inactive = users.stream()
                    .filter(row -> row.daysSinceLastLogon() != null && row.daysSinceLastLogon() > INACTIVE_ACCOUNT_DAYS)
                    .sorted(Comparator.comparing(DashboardUserRow::daysSinceLastLogon, Comparator.reverseOrder()))
                    .toList();

            List<DashboardUserRow> blocked = users.stream()
                    .filter(DashboardUserRow::locked)
                    .sorted(Comparator.comparing(DashboardUserRow::lockoutTime, Comparator.reverseOrder()))
                    .toList();

            return new ActiveDirectoryDashboardCompleto(
                    enabled,
                    disabled,
                    locked,
                    dcs,
                    ous,
                    topAlerts(passwords, "dias sin cambiar clave", DashboardUserRow::daysSincePasswordChange),
                    passwords.size(),
                    topAlerts(inactive, "dias sin iniciar sesion", DashboardUserRow::daysSinceLastLogon),
                    inactive.size(),
                    blocked.stream()
                            .limit(10)
                            .map(row -> new AdUserAlerta(row.samAccountName(), row.displayName(), lockoutDetail(row.lockoutTime())))
                            .toList(),
                    blocked.size()
            );
        } catch (Exception e) {
            log.warn("Error construyendo dashboard completo de Active Directory", e);
            return emptyDashboardCompleto();
        }
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
                });
    }

    private ActiveDirectoryResponse<AdUser> modifyGroup(String samAccountName, String groupDn, int operation,
                                                        String action, String message) {
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
        });
    }

    private ActiveDirectoryResponse<AdUser> withUserWrite(String samAccountName, String action, String successMessage,
                                                         UserWriteOperation operation) {
        String userDn = null;
        DirContext context = null;
        try {
            context = contextFactory.openDirContext();
            SearchResult result = findUser(context, samAccountName, USER_ATTRIBUTES);
            if (result == null) {
                audit(action, samAccountName, null, 404, "Usuario no encontrado.");
                return ActiveDirectoryResponse.error("Usuario no encontrado.");
            }
            userDn = result.getNameInNamespace();
            operation.apply(context, userDn, result);
            audit(action, samAccountName, userDn, 200, successMessage);
            ActiveDirectoryResponse<AdUser> refreshed = buscarUsuarioPorSam(samAccountName);
            return refreshed.success()
                    ? ActiveDirectoryResponse.ok(successMessage, refreshed.data())
                    : ActiveDirectoryResponse.ok(successMessage, null);
        } catch (IllegalArgumentException | IllegalStateException e) {
            audit(action, samAccountName, userDn, 400, e.getMessage());
            return ActiveDirectoryResponse.error(e.getMessage());
        } catch (Exception e) {
            log.warn("Error ejecutando accion {} en Active Directory para samAccountName={}", action, samAccountName, e);
            audit(action, samAccountName, userDn, 500, e.getMessage());
            return ActiveDirectoryResponse.error("Error ejecutando accion en Active Directory: " + e.getMessage());
        } finally {
            closeQuietly(context);
        }
    }

    private SearchResult findUser(DirContext context, String samAccountName, String[] returningAttributes) throws Exception {
        String filter = "(&(objectCategory=person)(objectClass=user)(sAMAccountName=" + LdapFilterUtils.escape(samAccountName) + "))";
        NamingEnumeration<SearchResult> results = context.search(contextFactory.baseDn(), filter, controls(returningAttributes, 1));
        return results.hasMore() ? results.next() : null;
    }

    String buildUserSearchFilter(String usuario, String nombre, String oficina) {
        StringBuilder filter = new StringBuilder("(&(objectCategory=person)(objectClass=user)");
        appendContainsFilter(filter, "sAMAccountName", usuario);
        appendContainsFilter(filter, "displayName", nombre);
        appendContainsFilter(filter, "physicalDeliveryOfficeName", oficina);
        filter.append(")");
        return filter.toString();
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

    private List<DashboardUserRow> collectDashboardUsers() throws Exception {
        List<DashboardUserRow> users = new ArrayList<>();
        LdapContext context = null;
        try {
            context = contextFactory.openLdapContext();
            byte[] cookie = null;
            SearchControls controls = controls(new String[]{
                    "sAMAccountName", "displayName", "userAccountControl", "lockoutTime",
                    "badPwdCount", "pwdLastSet", "lastLogonTimestamp", "distinguishedName"
            }, 0);
            do {
                context.setRequestControls(new Control[]{new PagedResultsControl(500, cookie, Control.CRITICAL)});
                NamingEnumeration<SearchResult> results = context.search(
                        contextFactory.baseDn(),
                        "(&(objectCategory=person)(objectClass=user)(sAMAccountName=*))",
                        controls
                );
                try {
                    while (results.hasMore()) {
                        users.add(toDashboardUserRow(results.next()));
                    }
                } catch (PartialResultException ignored) {
                    break;
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
        } finally {
            closeQuietly(context);
        }
        return users;
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
                context.setRequestControls(new Control[]{new PagedResultsControl(500, cookie, Control.CRITICAL)});
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

    private AdUserSummary toUserSummary(SearchResult result) throws Exception {
        Attributes attrs = result.getAttributes();
        return new AdUserSummary(
                attr(attrs, "sAMAccountName"),
                attr(attrs, "displayName"),
                attr(attrs, "mail"),
                attr(attrs, "physicalDeliveryOfficeName"),
                extractOus(result.getNameInNamespace()),
                (parseInt(attr(attrs, "userAccountControl")) & ACCOUNT_DISABLED) == 0,
                parseLong(attr(attrs, "lockoutTime")) > 0
        );
    }

    private DashboardUserRow toDashboardUserRow(SearchResult result) throws Exception {
        Attributes attrs = result.getAttributes();
        long lockoutTime = parseLong(attr(attrs, "lockoutTime"));
        return new DashboardUserRow(
                attr(attrs, "sAMAccountName"),
                attr(attrs, "displayName"),
                (parseInt(attr(attrs, "userAccountControl")) & ACCOUNT_DISABLED) == 0,
                lockoutTime > 0,
                lockoutTime,
                daysSinceFileTime(attr(attrs, "pwdLastSet")),
                daysSinceFileTime(attr(attrs, "lastLogonTimestamp")),
                extractOus(result.getNameInNamespace())
        );
    }

    private List<AdUserAlerta> topAlerts(List<DashboardUserRow> rows, String suffix, AlertDaysExtractor extractor) {
        return rows.stream()
                .limit(10)
                .map(row -> new AdUserAlerta(row.samAccountName(), row.displayName(), extractor.days(row) + " " + suffix))
                .toList();
    }

    private ActiveDirectoryDashboardCompleto emptyDashboardCompleto() {
        return new ActiveDirectoryDashboardCompleto(0, 0, 0, 0, List.of(), List.of(), 0, List.of(), 0, List.of(), 0);
    }

    private String blankToDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private String lockoutDetail(long lockoutTime) {
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
        void apply(DirContext context, String userDn, SearchResult result) throws Exception;
    }

    @FunctionalInterface
    private interface AlertDaysExtractor {
        Long days(DashboardUserRow row);
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
