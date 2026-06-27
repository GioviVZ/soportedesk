package com.inia.soportedesk.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtAuthFilterTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private CustomUserDetailsService userDetailsService;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    private JwtAuthFilter filter;

    @BeforeEach
    void setUp() {
        // Built here, not as a field initializer: @Mock fields are only injected by
        // MockitoExtension after the test instance is constructed, so a field
        // initializer would capture nulls for jwtService/userDetailsService.
        filter = new JwtAuthFilter(jwtService, userDetailsService);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void doFilterInternal_withEditPermiso_grantsReadAndWriteAuthorities() throws Exception {
        UserDetails userDetails = new User("soporte01", "hash", true, true, true, true,
                List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_SOPORTE")));

        when(request.getHeader("Authorization")).thenReturn("Bearer faketoken");
        when(jwtService.extractUsername("faketoken")).thenReturn("soporte01");
        when(userDetailsService.loadUserByUsername("soporte01")).thenReturn(userDetails);
        when(jwtService.isTokenValid("faketoken", "soporte01")).thenReturn(true);
        when(jwtService.extractPermisos("faketoken")).thenReturn(Map.of("licencias", "EDIT", "auditoria", "VIEW"));

        filter.doFilterInternal(request, response, filterChain);

        List<String> authorities = SecurityContextHolder.getContext().getAuthentication().getAuthorities()
                .stream().map(GrantedAuthority::getAuthority).toList();

        assertThat(authorities).contains("ROLE_SOPORTE", "READ_licencias", "WRITE_licencias",
                "READ_auditoria");
        assertThat(authorities).doesNotContain("WRITE_auditoria");
    }
}
