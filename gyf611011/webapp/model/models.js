sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
], function (JSONModel, Device) {
    "use strict";

    return {

        createDeviceModel: function () {
            var oModel = new JSONModel(Device);
            oModel.setDefaultBindingMode("OneWay");
            return oModel;
        },

        createRuntimeModel: function () {
            var oModel = new JSONModel({
                currentBatchNo: "",
                currentRecipeId: "",
                currentPhase: 0,
                phaseNames: ["预熔", "升温", "调温", "保温", "浇模"],
                phaseScanned: [false, false, false, false, false],
                isLocked: false,
                lockReason: "",
                isAlarm: false,
                alarmMessage: "",
                isNightMode: false,
                supervisorPassword: "Cocoa@2024",
                startTime: null,
                curveData: [],
                anomalyRecords: [],
                temperatureMin: 28,
                temperatureMax: 34,
                speedMin: 60,
                speedMax: 120,
                currentTemperature: 0,
                currentSpeed: 0,
                isSimulating: false
            });
            return oModel;
        }
    };
});
