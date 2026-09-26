package com.inia.soportedesk.realtime;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/realtime")
@RequiredArgsConstructor
public class RealtimeController {

    private final RealtimeEventService eventService;

    @GetMapping(value = "/events", produces = "text/event-stream")
    @PreAuthorize("isAuthenticated()")
    public SseEmitter events() {
        return eventService.subscribe();
    }
}
