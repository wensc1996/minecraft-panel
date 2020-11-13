'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
    const { router, controller, io } = app;
    router.get('/index', controller.home.index);
    router.post('/login',controller.login.index);

    router.post('/getLocationList', controller.location.getLocationList);
    router.post('/addLocation', controller.location.addLocation);

    router.get('/mcBridge', controller.mcbridge.getBridgeMessage);

    io.of('/').route('thread', io.controller.mcbridge.thread)
};
