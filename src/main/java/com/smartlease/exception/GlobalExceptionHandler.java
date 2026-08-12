package com.smartlease.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.LocalDateTime;
import java.util.Locale;

/**
 * Global exception handling for the API.
 *
 * <p>Before this class existed, any exception thrown by a controller/service was left
 * unhandled and ended up in Spring Boot's {@code /error} dispatch. Because the Spring
 * Security filter chain is applied to error dispatches and {@code /error} is not part of
 * the permitAll rules, those errors were surfaced to clients as a misleading
 * {@code 401 Unauthorized}. Handling exceptions here, inside the DispatcherServlet,
 * prevents that error-dispatch masking and returns proper HTTP status codes instead.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Catches the plain {@link RuntimeException}s thrown by the service layer and maps
     * them to a proper HTTP status based on their message.
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntimeException(RuntimeException ex) {
        return build(resolveStatus(ex.getMessage()), ex.getMessage());
    }

    /** Invalid request body validation (e.g. {@code @Valid} on a request DTO). */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
        return build(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    /** Malformed or unreadable JSON request body. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
        return build(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    /** Path variable or request parameter of the wrong type (e.g. a non-numeric id). */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return build(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    /** Required query parameter missing (e.g. the {@code file} part on image upload). */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleMissingParameter(MissingServletRequestParameterException ex) {
        return build(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    /** Required multipart part missing. */
    @ExceptionHandler(MissingServletRequestPartException.class)
    public ResponseEntity<ErrorResponse> handleMissingPart(MissingServletRequestPartException ex) {
        return build(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    /** HTTP method not supported for the path. */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        return build(HttpStatus.METHOD_NOT_ALLOWED, ex.getMessage());
    }

    /** Unsupported Content-Type. */
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMediaTypeNotSupported(HttpMediaTypeNotSupportedException ex) {
        return build(HttpStatus.UNSUPPORTED_MEDIA_TYPE, ex.getMessage());
    }

    /** No handler found for the requested path. */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoResourceFound(NoResourceFoundException ex) {
        return build(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    /** Database constraint violations (duplicate rows, NOT NULL, etc.). */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        return build(HttpStatus.CONFLICT, ex.getMessage());
    }

    /**
     * Maps a business-rule exception message to the appropriate HTTP status.
     * The services throw plain {@link RuntimeException}s with descriptive messages,
     * so the mapping is based on those messages.
     */
    private HttpStatus resolveStatus(String message) {

        if (message == null || message.isBlank()) {
            return HttpStatus.INTERNAL_SERVER_ERROR;
        }

        String m = message.toLowerCase(Locale.ROOT);

        if (m.contains("not found")) {
            return HttpStatus.NOT_FOUND;                    // 404, e.g. "Property not found", "Tenant not found"
        }
        if (m.contains("already exists") || m.contains("no longer available")) {
            return HttpStatus.CONFLICT;                     // 409, e.g. "Email already exists", "Property is no longer available"
        }
        if (m.contains("invalid email") || m.contains("invalid password")) {
            return HttpStatus.UNAUTHORIZED;                 // 401, invalid credentials
        }
        if (m.contains("only the owner")) {
            return HttpStatus.FORBIDDEN;                    // 403, not the property owner
        }
        if (m.contains("must not be null")
                || m.contains("no owner")
                || m.contains("invalid")
                || m.startsWith("only ")
                || m.contains("must be accepted or rejected")) {
            return HttpStatus.BAD_REQUEST;                  // 400, client-side business rule violations
        }

        return HttpStatus.INTERNAL_SERVER_ERROR;            // 500, anything unexpected
    }

    private ResponseEntity<ErrorResponse> build(HttpStatus status, String message) {

        ErrorResponse body = new ErrorResponse(
                status.value(),
                status.getReasonPhrase(),
                message,
                LocalDateTime.now()
        );

        return ResponseEntity.status(status).body(body);
    }
}
