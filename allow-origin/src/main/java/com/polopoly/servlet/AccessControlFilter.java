package com.polopoly.servlet;

import java.io.IOException;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class AccessControlFilter implements Filter {

    String contentType;
    // $origin
    String allowOrigin;
    // $access-control-request-method
    String allowMethod;
    // $access-control-request-headers
    String allowHeaders;
    
    public void init(FilterConfig config) throws ServletException
    {
        contentType = config.getInitParameter("contentType");
        if (contentType == null) {
            contentType = "text/xml";
        }
        allowOrigin = config.getInitParameter("allowOrigin");
        if (allowOrigin == null) {
            allowOrigin = "http://localhost:8080";
        }
        allowMethod = config.getInitParameter("allowMethod");
        if (allowMethod == null) {
            allowMethod = "POST, GET, OPTIONS";
        }
        allowHeaders = config.getInitParameter("allowHeaders");
        if (allowHeaders == null) {
            allowHeaders = "$access-control-request-headers";
        }
    }

    public void destroy()
    {
    }

    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
        throws IOException, ServletException
    {
        if (request instanceof HttpServletRequest) {
            HttpServletRequest httpRequest = (HttpServletRequest) request;
            if ("OPTIONS".equals(httpRequest.getMethod())) {
                respond(httpRequest, (HttpServletResponse) response);
                return;
            }
        }
        chain.doFilter(request, response);
    }

    private void respond(HttpServletRequest request, HttpServletResponse response)
    {
        response.addHeader("Allow", "GET, HEAD, POST, PUT, DELETE, OPTIONS");
        addHeader("Access-Control-Allow-Origin", allowOrigin, request, response);
        addHeader("Access-Control-Allow-Methods", allowMethod, request, response);
        addHeader("Access-Control-Allow-Headers", allowHeaders, request, response);
        response.setContentType(contentType);
        response.setContentLength(0);
    }

    private void addHeader(String header, String value, HttpServletRequest request, HttpServletResponse response)
    {
        String actualValue = value;
        if (value != null && value.startsWith("$")) {
            actualValue = request.getHeader(value.substring(1));
            if ("null".equals(actualValue) && "Access-Control-Allow-Origin".equals(header)) {
                actualValue = "*";
            }
        }
        if (actualValue != null) {
            response.setHeader(header, actualValue);
        }
    }
}
