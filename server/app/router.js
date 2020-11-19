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
    router.post('/deleteLocation', controller.location.deleteLocation);

    io.of('/').route('thread', io.controller.mcbridge.thread)

    router.post('/killProcess', io.controller.mcbridge.killProcess);
    router.post('/beginProcess', io.controller.mcbridge.beginProcess);

    router.post('/backupPlayer', controller.playerFiles.backupPlayer);
    router.post('/restorePlayer', controller.playerFiles.restorePlayer);
};
