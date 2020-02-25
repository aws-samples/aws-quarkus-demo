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
package com.amazon.example.resource;

import com.amazon.example.pojo.User;
import com.amazon.example.service.UserService;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;

import javax.inject.Inject;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import java.util.List;
import java.util.UUID;

@Path("/users")
public class UserResource {

    private final Logger log = LoggerFactory.getLogger(UserResource.class);

    @Inject
    UserService service;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("{userid}")
    public User getUser(@PathParam("userid") String userId) {
        return service.get(userId);
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public List<User> getUsers() {
        return service.findAll();
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public User createUser(User user) {

        user.setUserId(this.createUserId());

        service.add(user);

        log.info("Created user " + user);

        return getUser(user.getUserId());
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @Path("{userid}")
    public List<User> deleteUser(@PathParam("userid") String userId) {
        return service.delete(userId);
    }

    private String createUserId() {
        return UUID.randomUUID().toString();
    }

}