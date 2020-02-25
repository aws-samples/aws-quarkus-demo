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
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.jboss.logging.Logger;

import javax.inject.Inject;
import javax.inject.Named;
import java.util.List;

@Named("processing")
public class ProcessingLambda implements RequestHandler<InputObject, OutputObject> {

    private static final Logger LOGGER = Logger.getLogger(ProcessingLambda.class);

    private ObjectMapper mapper;

    public ProcessingLambda() {
        mapper = new ObjectMapper();
        mapper.enable(SerializationFeature.INDENT_OUTPUT);
    }

    @Inject
    UserService userService;

    @Override
    public OutputObject handleRequest(InputObject inputObject, Context context) {

        OutputObject outputObject = new OutputObject();

        User user;
        String str;
        List<User> userList;

        switch (inputObject.getCommand()){
            case GET:
                user = userService.get(inputObject.getUserId());
                LOGGER.info("GET: " + user);
                str = null;
                try {
                    str = mapper.writeValueAsString(user);
                    outputObject.setResult(str);
                    outputObject.setRequestId(context.getAwsRequestId());
                }

                catch (JsonProcessingException exc) {
                    LOGGER.error(exc);
                }
                break;
            case GETALL:
                userList = userService.findAll();

                LOGGER.info("GETALL: " + userList);
                str = null;
                try {
                    str = mapper.writeValueAsString(userList);
                    outputObject.setResult(str);
                    outputObject.setRequestId(context.getAwsRequestId());
                }

                catch (JsonProcessingException exc) {
                    LOGGER.error(exc);
                }

                break;
            case POST:
                user = new User();
                user.setAge(inputObject.getAge());
                user.setFirstName(inputObject.getFirstName());
                user.setLastName(inputObject.getLastName());
                user.setUserId(inputObject.getUserId());
                user.setUserName(inputObject.getUserName());

                LOGGER.info("POST: " + user);
                userList = userService.add(user);
                LOGGER.info("POST: " + userList);

                str = null;
                try {
                    str = mapper.writeValueAsString(userList);
                    outputObject.setResult(str);
                    outputObject.setRequestId(context.getAwsRequestId());
                }

                catch (JsonProcessingException exc) {
                    LOGGER.error(exc);
                }

                break;
            case DELETE:
                userList = userService.delete(inputObject.getUserId());

                LOGGER.info("DELETE: " + userList);
                str = null;
                try {
                    str = mapper.writeValueAsString(userList);
                    outputObject.setResult(str);
                    outputObject.setRequestId(context.getAwsRequestId());
                }

                catch (JsonProcessingException exc) {
                    LOGGER.error(exc);
                }

                break;
            default:
        }

        return outputObject;
    }
}
