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

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

import com.amazon.example.pojo.User;
import com.amazon.example.service.UserService;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import org.junit.jupiter.api.Test;

import io.vertx.core.json.JsonObject;

import javax.inject.Inject;
import java.util.List;

@QuarkusTest
public class UserResourceTest {

    @Inject
    UserService service;

    @Test
    public void testUsersGetEndpoint() {
        given()
                .when().get("/users")
                .then()
                .statusCode(200);
    }

    @Test
    public void testCrud() {

        // First create a user
        String body = new JsonObject()
                .put("userName", "johndoe")
                .put("firstName", "John")
                .put("lastName", "Doe")
                .put("age", "42").toString();

        Response response = given()
                .contentType(ContentType.JSON).body(body)
                .post("/users").then().statusCode(200)
                .body("userName", is("johndoe"))
                .body("firstName", is("John"))
                .body("lastName", is("Doe"))
                .body("age", is(42))
                .extract().response();

        User tmpUser = response.as(User.class);
        boolean exception = false;

        try {

            // Read the user

            User user = service.get(tmpUser.getUserId());
            assertEquals(user, tmpUser);

            // Delete the user

            List<User> userList = service.delete(tmpUser.getUserId());

            // Try to read it again
            User tmp2User = service.get(tmpUser.getUserId());
            assertEquals(tmp2User.getUserId(), null);
        }

        catch (Exception exc) {
            exc.printStackTrace();
            exception = true;
        }

        assertFalse(exception);
    }

}