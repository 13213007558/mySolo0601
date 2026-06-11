sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "com/cocoa/tempering/model/models"
], function (UIComponent, Device, models) {
    "use strict";

    return UIComponent.extend("com.cocoa.tempering.Component", {

        metadata: {
            manifest: "json"
        },

        init: function () {
            UIComponent.prototype.init.apply(this, arguments);

            this.setModel(models.createDeviceModel(), "device");
            this.setModel(models.createRuntimeModel(), "runtime");

            this.getRouter().initialize();
        }
    });
});
