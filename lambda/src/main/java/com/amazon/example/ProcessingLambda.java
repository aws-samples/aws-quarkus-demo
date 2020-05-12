/*
 * Copyright 2010-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 *  http://aws.amazon.com/apache2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 *
 */
package com.amazon.example;

import com.amazon.example.pojo.User;
import com.amazon.example.service.UserService;
import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jboss.logging.Logger;

import javax.inject.Inject;
import javax.inject.Named;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Named("processing")
public class ProcessingLambda implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    private static final Logger LOGGER = Logger.getLogger(ProcessingLambda.class);

    private ObjectMapper mapper = new ObjectMapper();

    @Inject
    UserService userService;

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent request, Context context) {

        Map<String, String> query = request.getQueryStringParameters();

        LOGGER.info(String.format("[%s] Processed data", request));

        User user;
        String result = "";
        List<User> userList;

        String httpMethod = request.getHttpMethod();

        Map<String, String> pathParameters = request.getPathParameters();

        switch (httpMethod) {

            case "GET":
                Map<String, String> queryStringParameters = request.getQueryStringParameters();

                String userId = null;

                if (pathParameters != null)
                    userId = pathParameters.get("userId");
                else if (queryStringParameters != null)
                    userId = queryStringParameters.get("userId");

                if (userId == null || userId.length() == 0) {
                    LOGGER.info("Getting all users");
                    userList = userService.findAll();
                    LOGGER.info("GET: " + userList);
                    try {
                        result = mapper.writeValueAsString(userList);
                    } catch (JsonProcessingException exc) {
                        LOGGER.error(exc);
                    }
                } else {
                    user = userService.get(userId);
                    LOGGER.info("GET: " + user);

                    if (user.getUserId() == null)
                        result = "";
                    else {
                        try {
                            result = mapper.writeValueAsString(user);
                        } catch (JsonProcessingException exc) {
                            LOGGER.error(exc);
                        }
                    }
                }
                break;
            case "POST":
                String body = request.getBody();
                try {
                    User tmpUser = mapper.readValue(body, User.class);
                    tmpUser.setUserId(createUserId());

                    LOGGER.info("POST: " + tmpUser);
                    String tmpId = userService.add(tmpUser);

                    result = tmpId;
                }
                catch (JsonProcessingException exc) {
                    LOGGER.error(exc);
                }
                break;
            case "DELETE":
                if (pathParameters != null) {
                    String id = pathParameters.get("userId");
                    String tmpId = userService.delete(id);

                    LOGGER.info("DELETE: " + tmpId);

                    result = tmpId;
                }
                break;
        }

        return new APIGatewayProxyResponseEvent().withBody(result).withStatusCode(200);
    }

    private String createUserId() {
        return UUID.randomUUID().toString();
    }
}
