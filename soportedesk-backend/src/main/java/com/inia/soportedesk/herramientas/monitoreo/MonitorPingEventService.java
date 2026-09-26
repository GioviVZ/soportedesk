package com.inia.soportedesk.herramientas.monitoreo;

import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class MonitorPingEventService {

    private static final long TIMEOUT = 30L * 60L * 1000L;
    private final List<SseEmitter> clients = new CopyOnWriteArrayList<>();

    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(TIMEOUT);
        clients.add(emitter);
        emitter.onCompletion(() -> clients.remove(emitter));
        emitter.onTimeout(() -> clients.remove(emitter));
        emitter.onError(error -> clients.remove(emitter));
        try {
            emitter.send(SseEmitter.event().name("connected").data("ok"));
        } catch (IOException error) {
            clients.remove(emitter);
            emitter.completeWithError(error);
        }
        return emitter;
    }

    public void publish(MonitorPingEventResponse event) {
        clients.forEach(client -> {
            try {
                client.send(SseEmitter.event().name("sample").data(event));
            } catch (IOException | IllegalStateException error) {
                clients.remove(client);
                client.complete();
            }
        });
    }
}
