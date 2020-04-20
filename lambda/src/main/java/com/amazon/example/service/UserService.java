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
package com.amazon.example.service;

import com.amazon.example.pojo.User;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import java.util.List;
import java.util.stream.Collectors;

@ApplicationScoped
public class UserService extends AbstractService {

    @Inject
    DynamoDbClient dynamoDB;

    public List<User> findAll() {
        return dynamoDB.scanPaginator(scanRequest()).items().stream()
                .map(User::from)
                .collect(Collectors.toList());
    }

    public String add(User user) {
        dynamoDB.putItem(putRequest(user));

        return user.getUserId();
    }

    public User get(String userId) {
        return User.from(dynamoDB.getItem(getRequest(userId)).item());
    }

    public String delete(String userId) {
        dynamoDB.deleteItem(deleteRequest(userId));

        return userId;
    }
}
