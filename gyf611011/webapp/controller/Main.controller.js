sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
], function (Controller, MessageToast, MessageBox, JSONModel, Device) {
    "use strict";

    return Controller.extend("com.cocoa.tempering.controller.Main", {

        onInit: function () {
            this._oAlarmSound = null;
            this._simulationTimer = null;
            this._elapsedSeconds = 0;
            this._currentRecipe = null;
            this._canvas = null;
            this._ctx = null;
            this._iLastKnownPhase = 0;

            this._initAlarmSound();

            this.getView().addEventDelegate({
                onAfterRendering: function () {
                    if (!this._oRuntimeModel) {
                        this._oRuntimeModel = this.getView().getModel("runtime");
                        this._oDataModel = this.getView().getModel();
                        this._oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
                        if (this._oRuntimeModel) {
                            this._oRuntimeModel.attachPropertyChange(function (oEvent) {
                                var sPath = oEvent.getParameter("path");
                                if (sPath === "/curveData" || sPath === "/currentTemperature" || sPath === "/currentSpeed") {
                                    this._drawChart();
                                }
                            }.bind(this));
                        }
                    }
                    this._initCanvas();
                    this._drawChart();
                    this._bindFileUpload();
                }.bind(this)
            });
        },

        _bindFileUpload: function () {
            if (this._bFileUploadBound) return;
            var oInput = document.getElementById(this.createId("fileUploader"));
            if (oInput) {
                oInput.addEventListener("change", this.onPhotoUploaded.bind(this));
                this._bFileUploadBound = true;
            }
        },

        _initCanvas: function () {
            if (!this._canvas) {
                var oCanvas = document.getElementById(this.createId("curveCanvas"));
                if (oCanvas) {
                    this._canvas = oCanvas;
                    this._ctx = oCanvas.getContext("2d");
                    var oWrapper = document.getElementById(this.createId("curveChartWrapper"));
                    if (oWrapper) {
                        var iWidth = oWrapper.clientWidth || 1000;
                        var iHeight = oWrapper.clientHeight || 480;
                        this._canvas.width = iWidth;
                        this._canvas.height = iHeight;
                    }
                }
            }
        },

        _drawChart: function () {
            this._initCanvas();
            if (!this._ctx || !this._canvas) return;

            var ctx = this._ctx;
            var W = this._canvas.width;
            var H = this._canvas.height;

            var bNight = this._oRuntimeModel.getProperty("/isNightMode");
            var bgColor = bNight ? "#0a0a0a" : "#ffffff";
            var axisColor = bNight ? "#555" : "#ccc";
            var textColor = bNight ? "#eee" : "#333";
            var gridColor = bNight ? "#222" : "#eee";

            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, W, H);

            var margin = { top: 30, right: 70, bottom: 50, left: 70 };
            var chartW = W - margin.left - margin.right;
            var chartH = H - margin.top - margin.bottom;

            var aCurve = this._oRuntimeModel.getProperty("/curveData") || [];
            var iPhase = this._oRuntimeModel.getProperty("/currentPhase");
            var fTempMin = this._oRuntimeModel.getProperty("/temperatureMin") || 0;
            var fTempMax = this._oRuntimeModel.getProperty("/temperatureMax") || 60;
            var fSpeedMin = this._oRuntimeModel.getProperty("/speedMin") || 0;
            var fSpeedMax = this._oRuntimeModel.getProperty("/speedMax") || 150;

            var tempPad = 5;
            var speedPad = 20;
            var yTempMin = Math.min(fTempMin - tempPad, (aCurve.length ? Math.min.apply(null, aCurve.map(function (d) { return d.temp; })) : fTempMin) - tempPad);
            var yTempMax = Math.max(fTempMax + tempPad, (aCurve.length ? Math.max.apply(null, aCurve.map(function (d) { return d.temp; })) : fTempMax) + tempPad);
            var ySpeedMin = 0;
            var ySpeedMax = Math.max(fSpeedMax + speedPad, (aCurve.length ? Math.max.apply(null, aCurve.map(function (d) { return d.speed; })) : fSpeedMax) + speedPad);

            var xMax = Math.max(150, aCurve.length ? aCurve[aCurve.length - 1].time : 150);

            function xScale(t) { return margin.left + (t / xMax) * chartW; }
            function yTempScale(v) { return margin.top + chartH - ((v - yTempMin) / (yTempMax - yTempMin)) * chartH; }
            function ySpeedScale(v) { return margin.top + chartH - ((v - ySpeedMin) / (ySpeedMax - ySpeedMin)) * chartH; }

            ctx.strokeStyle = gridColor;
            ctx.lineWidth = 1;
            for (var i = 0; i <= 5; i++) {
                var y = margin.top + (i / 5) * chartH;
                ctx.beginPath();
                ctx.moveTo(margin.left, y);
                ctx.lineTo(W - margin.right, y);
                ctx.stroke();

                var tVal = yTempMax - (i / 5) * (yTempMax - yTempMin);
                ctx.fillStyle = textColor;
                ctx.font = "12px Arial";
                ctx.textAlign = "right";
                ctx.fillText(tVal.toFixed(0) + "°C", margin.left - 8, y + 4);

                var sVal = ySpeedMax - (i / 5) * (ySpeedMax - ySpeedMin);
                ctx.textAlign = "left";
                ctx.fillText(Math.round(sVal) + "", W - margin.right + 8, y + 4);
            }

            for (var j = 0; j <= 5; j++) {
                var x = margin.left + (j / 5) * chartW;
                ctx.strokeStyle = gridColor;
                ctx.beginPath();
                ctx.moveTo(x, margin.top);
                ctx.lineTo(x, margin.top + chartH);
                ctx.stroke();

                var xVal = (j / 5) * xMax;
                ctx.fillStyle = textColor;
                ctx.textAlign = "center";
                ctx.fillText(Math.round(xVal) + "s", x, margin.top + chartH + 20);
            }

            ctx.strokeStyle = axisColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(margin.left, margin.top);
            ctx.lineTo(margin.left, margin.top + chartH);
            ctx.lineTo(W - margin.right, margin.top + chartH);
            ctx.stroke();

            ctx.fillStyle = "#e74c3c";
            ctx.font = "bold 13px Arial";
            ctx.textAlign = "center";
            ctx.fillText("温度 (°C)", margin.left - 40, margin.top - 10);
            ctx.fillStyle = "#3498db";
            ctx.fillText("转速 (RPM)", W - margin.right + 40, margin.top - 10);
            ctx.fillStyle = textColor;
            ctx.fillText("时间 (秒)", W / 2, H - 10);

            if (aCurve.length > 0) {
                ctx.fillStyle = "rgba(149, 165, 166, 0.15)";
                ctx.beginPath();
                ctx.moveTo(xScale(aCurve[0].time), yTempScale(aCurve[0].tempUpper));
                aCurve.forEach(function (d) { ctx.lineTo(xScale(d.time), yTempScale(d.tempUpper)); });
                for (var k = aCurve.length - 1; k >= 0; k--) {
                    ctx.lineTo(xScale(aCurve[k].time), yTempScale(aCurve[k].tempLower));
                }
                ctx.closePath();
                ctx.fill();

                ctx.strokeStyle = "#95a5a6";
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                aCurve.forEach(function (d, i) {
                    if (i === 0) ctx.moveTo(xScale(d.time), yTempScale(d.tempUpper));
                    else ctx.lineTo(xScale(d.time), yTempScale(d.tempUpper));
                });
                ctx.stroke();
                ctx.beginPath();
                aCurve.forEach(function (d, i) {
                    if (i === 0) ctx.moveTo(xScale(d.time), yTempScale(d.tempLower));
                    else ctx.lineTo(xScale(d.time), yTempScale(d.tempLower));
                });
                ctx.stroke();
                ctx.setLineDash([]);
            }

            if (this._currentRecipe && this._currentRecipe.standardCurve) {
                ctx.strokeStyle = "#f39c12";
                ctx.lineWidth = 2;
                ctx.beginPath();
                this._currentRecipe.standardCurve.forEach(function (d, i) {
                    if (d.time > xMax) return;
                    if (i === 0) ctx.moveTo(xScale(d.time), yTempScale(d.temp));
                    else ctx.lineTo(xScale(d.time), yTempScale(d.temp));
                });
                ctx.stroke();
            }

            if (aCurve.length > 1) {
                ctx.strokeStyle = "#e74c3c";
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                aCurve.forEach(function (d, i) {
                    if (i === 0) ctx.moveTo(xScale(d.time), yTempScale(d.temp));
                    else ctx.lineTo(xScale(d.time), yTempScale(d.temp));
                });
                ctx.stroke();

                ctx.strokeStyle = "#3498db";
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                aCurve.forEach(function (d, i) {
                    if (i === 0) ctx.moveTo(xScale(d.time), ySpeedScale(d.speed));
                    else ctx.lineTo(xScale(d.time), ySpeedScale(d.speed));
                });
                ctx.stroke();

                var last = aCurve[aCurve.length - 1];
                ctx.fillStyle = "#e74c3c";
                ctx.beginPath();
                ctx.arc(xScale(last.time), yTempScale(last.temp), 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#3498db";
                ctx.beginPath();
                ctx.arc(xScale(last.time), ySpeedScale(last.speed), 5, 0, Math.PI * 2);
                ctx.fill();
            }

            var aAnomalies = this._oRuntimeModel.getProperty("/anomalyRecords") || [];
            ctx.fillStyle = "#b00";
            aAnomalies.forEach(function (r) {
                var t = parseInt(r.timestamp && r.timestamp.split("T")[1].split(":")[2]) || 0;
                if (aCurve.length > 0) {
                    var idx = aCurve.length - 1;
                    ctx.beginPath();
                    ctx.arc(xScale(aCurve[idx].time), yTempScale(parseFloat(r.temp)), 6, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
        },

        _initAlarmSound: function () {
            try {
                this._oAlarmSound = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVh5FAAAAACAgICAgICAgICAgICAgICAgICAgICAgIB/gH9Af4D/fn+AgICAgICAgICAf4B/gH5/f4CAgICAgICAgICAgICAgICAgICAgICAgICAgICAf4CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg");
                this._oAlarmSound.loop = true;
            } catch (e) {
                console.warn("Audio init failed:", e);
            }
        },

        formatPhaseName: function (iPhase, aPhaseNames) {
            if (iPhase === null || iPhase === undefined) return "";
            return "阶段 " + (iPhase + 1) + " - " + (aPhaseNames && aPhaseNames[iPhase] ? aPhaseNames[iPhase] : "");
        },

        formatSystemStatus: function (bLocked, bAlarm) {
            if (bLocked) return "系统已锁定";
            if (bAlarm) return "参数脱离窗口 - 报警中";
            return "运行正常";
        },

        formatSystemStatusState: function (bLocked, bAlarm) {
            if (bLocked) return "Error";
            if (bAlarm) return "Warning";
            return "Success";
        },

        formatTemperature: function (fTemp) {
            if (fTemp === undefined || fTemp === null || fTemp === 0) return "0.0";
            return parseFloat(fTemp).toFixed(1);
        },

        formatSpeed: function (fSpeed) {
            if (fSpeed === undefined || fSpeed === null) return "0";
            return Math.round(fSpeed);
        },

        formatKpiState: function (fValue, fMin, fMax) {
            if (!fValue || fMin === undefined || fMax === undefined) return "None";
            if (fValue >= fMin && fValue <= fMax) return "Success";
            return "Error";
        },

        formatKpiStatusText: function (fValue, fMin, fMax) {
            if (!fValue || fMin === undefined || fMax === undefined) return "待运行";
            if (fValue >= fMin && fValue <= fMax) return "正常范围内";
            return "超出窗口";
        },

        formatStartEnabled: function (bSimulating, bLocked, sRecipeId) {
            return !bSimulating && !bLocked && !!sRecipeId;
        },

        formatEnabledNotLocked: function (bLocked) {
            return !bLocked;
        },

        formatAnomalyBtnEnabled: function (bLocked, bAlarm) {
            return !bLocked && bAlarm;
        },

        formatPhaseStepEnabled: function (bLocked, bSimulating) {
            return !bLocked && !bSimulating;
        },

        formatPhaseIconSrc: function (aScanned, iIndex) {
            if (aScanned && aScanned[iIndex]) return "sap-icon://accept";
            return "sap-icon://warning2";
        },

        formatPhaseIconColor: function (aScanned, iIndex) {
            if (aScanned && aScanned[iIndex]) return "#107e3e";
            return "#e74c3c";
        },

        formatPhaseGuidance: function (iPhase) {
            if (!this._currentRecipe) return "请先选择配方";
            var oPhase = this._currentRecipe.phases && this._currentRecipe.phases[iPhase];
            if (!oPhase) return "";
            return "【" + oPhase.name + "】温度窗口 " + oPhase.tempMin + "~" + oPhase.tempMax + "°C，转速窗口 " +
                oPhase.speedMin + "~" + oPhase.speedMax + " RPM，目标时长 " + oPhase.duration + " 秒。";
        },

        onRecipeChange: function (oEvent) {
            var sRecipeId = oEvent.getParameter("selectedItem").getKey();
            var aRecipes = this._oDataModel.getProperty("/recipes");
            this._currentRecipe = aRecipes.find(function (r) { return r.id === sRecipeId; });

            this._oRuntimeModel.setProperty("/currentRecipeId", sRecipeId);
            this._oRuntimeModel.setProperty("/curveData", []);
            this._oRuntimeModel.setProperty("/anomalyRecords", []);
            this._elapsedSeconds = 0;

            if (this._currentRecipe && this._currentRecipe.phases && this._currentRecipe.phases[0]) {
                this._applyPhaseWindow(0);
            }

            MessageToast.show(this._oBundle.getText("recipeLoaded") + ": " + this._currentRecipe.name);
            this._drawChart();
        },

        _applyPhaseWindow: function (iPhase) {
            if (!this._currentRecipe || !this._currentRecipe.phases || !this._currentRecipe.phases[iPhase]) return;
            var oPhase = this._currentRecipe.phases[iPhase];
            this._oRuntimeModel.setProperty("/temperatureMin", oPhase.tempMin);
            this._oRuntimeModel.setProperty("/temperatureMax", oPhase.tempMax);
            this._oRuntimeModel.setProperty("/speedMin", oPhase.speedMin);
            this._oRuntimeModel.setProperty("/speedMax", oPhase.speedMax);
            this._oRuntimeModel.setProperty("/currentPhase", iPhase);
            this._drawChart();
        },

        onScanBatch: function () {
            var sBatch = this._oRuntimeModel.getProperty("/currentBatchNo");
            if (!sBatch || sBatch.trim() === "") {
                this.byId("scanLotInput").setValue("");
                this.byId("scanDialog").open();
                return;
            }
            this._performPhaseScan();
        },

        onConfirmScan: function () {
            var sLot = this.byId("scanLotInput").getValue();
            if (!sLot) {
                MessageBox.warning("请输入或选择有效的原料批号");
                return;
            }
            if (!this._oRuntimeModel.getProperty("/currentBatchNo")) {
                this._oRuntimeModel.setProperty("/currentBatchNo", sLot);
            }
            this.byId("scanDialog").close();
            this._performPhaseScan();
        },

        onCloseScanDialog: function () {
            this.byId("scanDialog").close();
        },

        _performPhaseScan: function () {
            var sBatch = this._oRuntimeModel.getProperty("/currentBatchNo");
            if (!sBatch) {
                this.byId("scanDialog").open();
                return;
            }
            var iPhase = this._oRuntimeModel.getProperty("/currentPhase");
            var aScanned = this._oRuntimeModel.getProperty("/phaseScanned");
            aScanned[iPhase] = true;
            this._oRuntimeModel.setProperty("/phaseScanned", aScanned);
            MessageToast.show("阶段 " + (iPhase + 1) + " 原料批号已确认: " + sBatch);
        },

        onPhaseChange: function (oEvent) {
            var iNewPhase = oEvent.getParameter("value");
            var iOldPhase = this._iLastKnownPhase;

            if (iNewPhase > iOldPhase) {
                var aScanned = this._oRuntimeModel.getProperty("/phaseScanned");
                if (!aScanned[iOldPhase]) {
                    MessageBox.error("阶段 " + (iOldPhase + 1) + " 尚未扫码确认原料批号，禁止前进至下一阶段。", {
                        title: "扫码门禁 - 阶段切换被阻止"
                    });
                    this.byId("phaseStepInput").setValue(iOldPhase);
                    this._oRuntimeModel.setProperty("/currentPhase", iOldPhase);
                    return;
                }
                if (!aScanned[iNewPhase]) {
                    this.byId("phaseStepInput").setValue(iOldPhase);
                    this._oRuntimeModel.setProperty("/currentPhase", iOldPhase);
                    MessageBox.warning("新阶段 " + (iNewPhase + 1) + " 必须扫码确认原料批号后方可进入。", {
                        title: "扫码门禁",
                        actions: [MessageBox.Action.OK],
                        onClose: function () {
                            this._applyPhaseWindow(iNewPhase);
                            this.byId("scanLotInput").setValue("");
                            this.byId("scanDialog").open();
                        }.bind(this)
                    });
                    return;
                }
            }

            if (this._oRuntimeModel.getProperty("/isLocked")) {
                MessageBox.error("系统已锁定，无法切换阶段");
                this.byId("phaseStepInput").setValue(iOldPhase);
                this._oRuntimeModel.setProperty("/currentPhase", iOldPhase);
                return;
            }

            this._applyPhaseWindow(iNewPhase);
            this._iLastKnownPhase = iNewPhase;
            MessageToast.show("已切换至阶段 " + (iNewPhase + 1));
        },

        onStartSimulation: function () {
            if (!this._currentRecipe) {
                MessageBox.warning("请先选择配方");
                return;
            }
            var sBatch = this._oRuntimeModel.getProperty("/currentBatchNo");
            if (!sBatch) {
                MessageBox.warning(this._oBundle.getText("batchRequired"));
                return;
            }

            var aScanned = this._oRuntimeModel.getProperty("/phaseScanned");
            var iCurrentPhase = this._oRuntimeModel.getProperty("/currentPhase");
            if (!aScanned[iCurrentPhase]) {
                MessageBox.warning("当前阶段尚未扫码确认原料批号，请先扫码后方可开始模拟。", {
                    title: "扫码门禁",
                    actions: [MessageBox.Action.OK],
                    onClose: function () {
                        this.byId("scanLotInput").setValue("");
                        this.byId("scanDialog").open();
                    }.bind(this)
                });
                return;
            }

            this._oRuntimeModel.setProperty("/isSimulating", true);
            this._oRuntimeModel.setProperty("/startTime", new Date().toISOString());
            this._elapsedSeconds = 0;
            this._oRuntimeModel.setProperty("/curveData", []);

            this._simulationTimer = setInterval(this._simulateTick.bind(this), 1000);
            MessageToast.show("模拟已启动");
        },

        onStopSimulation: function () {
            if (this._simulationTimer) {
                clearInterval(this._simulationTimer);
                this._simulationTimer = null;
            }
            this._oRuntimeModel.setProperty("/isSimulating", false);
            this._stopAlarm();
            MessageToast.show("模拟已停止");
        },

        _simulateTick: function () {
            this._elapsedSeconds += 1;

            var iPhase = this._oRuntimeModel.getProperty("/currentPhase");
            var oPhase = this._currentRecipe.phases[iPhase];
            if (!oPhase) return;

            var fTargetTemp = oPhase.tempTarget;
            var fTargetSpeed = oPhase.speedTarget;

            var fNoiseTemp = (Math.random() - 0.5) * 4;
            var fNoiseSpeed = (Math.random() - 0.5) * 20;

            var fDriftChance = 0.08;
            if (Math.random() < fDriftChance) {
                fNoiseTemp += (Math.random() > 0.5 ? 1 : -1) * (oPhase.tempMax - oPhase.tempMin) * 0.8;
            }
            if (Math.random() < fDriftChance) {
                fNoiseSpeed += (Math.random() > 0.5 ? 1 : -1) * (oPhase.speedMax - oPhase.speedMin) * 0.8;
            }

            var fTemp = fTargetTemp + fNoiseTemp;
            var fSpeed = fTargetSpeed + fNoiseSpeed;

            fTemp = Math.max(0, Math.min(70, fTemp));
            fSpeed = Math.max(0, Math.min(200, fSpeed));

            this._oRuntimeModel.setProperty("/currentTemperature", fTemp);
            this._oRuntimeModel.setProperty("/currentSpeed", fSpeed);

            var aCurve = this._oRuntimeModel.getProperty("/curveData") || [];
            aCurve.push({
                time: this._elapsedSeconds,
                temp: parseFloat(fTemp.toFixed(1)),
                speed: Math.round(fSpeed),
                tempLower: oPhase.tempMin,
                tempUpper: oPhase.tempMax
            });
            if (aCurve.length > 300) aCurve.shift();
            this._oRuntimeModel.setProperty("/curveData", aCurve);

            this._checkCrystalWindow(fTemp, fSpeed, oPhase);

            if (this._elapsedSeconds >= oPhase.duration && iPhase < 4) {
                var aScanned = this._oRuntimeModel.getProperty("/phaseScanned");
                if (aScanned[iPhase]) {
                    clearInterval(this._simulationTimer);
                    this._simulationTimer = null;
                    this._oRuntimeModel.setProperty("/isSimulating", false);
                    MessageBox.information("阶段 " + (iPhase + 1) + " 已完成，是否进入下一阶段？", {
                        actions: ["进入下一阶段", "停留在当前阶段"],
                        onClose: function (sAction) {
                            if (sAction === "进入下一阶段") {
                                var aNewScanned = this._oRuntimeModel.getProperty("/phaseScanned");
                                if (!aNewScanned[iPhase + 1]) {
                                    this._applyPhaseWindow(iPhase + 1);
                                    this._iLastKnownPhase = iPhase + 1;
                                    MessageBox.warning("阶段 " + (iPhase + 2) + " 必须扫码确认原料批号后方可开始模拟。", {
                                        title: "扫码门禁",
                                        actions: [MessageBox.Action.OK],
                                        onClose: function () {
                                            this.byId("scanLotInput").setValue("");
                                            this.byId("scanDialog").open();
                                        }.bind(this)
                                    });
                                } else {
                                    this._applyPhaseWindow(iPhase + 1);
                                    this._iLastKnownPhase = iPhase + 1;
                                    MessageToast.show("已切换至阶段 " + (iPhase + 2));
                                }
                            }
                        }.bind(this)
                    });
                }
            }
        },

        _checkCrystalWindow: function (fTemp, fSpeed, oPhase) {
            var bOutOfRange = fTemp < oPhase.tempMin || fTemp > oPhase.tempMax ||
                fSpeed < oPhase.speedMin || fSpeed > oPhase.speedMax;

            if (bOutOfRange) {
                if (!this._oRuntimeModel.getProperty("/isLocked")) {
                    var sReason = "";
                    if (fTemp < oPhase.tempMin) sReason += "温度过低(" + fTemp.toFixed(1) + "°C < " + oPhase.tempMin + "°C) ";
                    if (fTemp > oPhase.tempMax) sReason += "温度过高(" + fTemp.toFixed(1) + "°C > " + oPhase.tempMax + "°C) ";
                    if (fSpeed < oPhase.speedMin) sReason += "转速过低(" + Math.round(fSpeed) + " < " + oPhase.speedMin + ") ";
                    if (fSpeed > oPhase.speedMax) sReason += "转速过高(" + Math.round(fSpeed) + " > " + oPhase.speedMax + ") ";

                    this._oRuntimeModel.setProperty("/isAlarm", true);
                    this._oRuntimeModel.setProperty("/isLocked", true);
                    this._oRuntimeModel.setProperty("/lockReason", sReason.trim());
                    this._oRuntimeModel.setProperty("/alarmMessage", this._oBundle.getText("alarmOutOfWindow"));

                    this._startAlarm();
                    this._showLockOverlay();

                    if (this._simulationTimer) {
                        clearInterval(this._simulationTimer);
                        this._simulationTimer = null;
                    }
                    this._oRuntimeModel.setProperty("/isSimulating", false);

                    MessageBox.error(this._oBundle.getText("alarmOutOfWindow") + "\n原因：" + sReason.trim(), {
                        title: "结晶窗口脱离报警",
                        details: "系统已锁定，须领班密码解锁后方可继续。请记录异常码并拍照留档。",
                        actions: ["记录异常", "领班解锁"],
                        onClose: function (sAction) {
                            if (sAction === "记录异常") {
                                this.onShowAnomalyDialog();
                            } else if (sAction === "领班解锁") {
                                this.onShowUnlockDialog();
                            }
                        }.bind(this)
                    });
                }
            }
        },

        _startAlarm: function () {
            if (this._oAlarmSound) {
                try {
                    this._oAlarmSound.play();
                } catch (e) {
                    console.warn("Alarm play failed:", e);
                }
            }
        },

        _stopAlarm: function () {
            if (this._oAlarmSound) {
                try {
                    this._oAlarmSound.pause();
                    this._oAlarmSound.currentTime = 0;
                } catch (e) {
                    console.warn("Alarm stop failed:", e);
                }
            }
        },

        _showLockOverlay: function () {
            var sReason = this._oRuntimeModel.getProperty("/lockReason");
            var sHtml = '<div id="__lockOverlay" class="lockOverlay">' +
                '<div class="lockContent">' +
                '<div class="lockTitle">⚠ 系统已物理锁定</div>' +
                '<div class="lockReason">脱离结晶窗口：' + sReason + '</div>' +
                '<div class="lockReason">请领班输入密码解锁，或先记录异常点。</div>' +
                '<div style="margin-top: 1rem;">' +
                '<button onclick="document.dispatchEvent(new CustomEvent(\'cocoaUnlock\'))" style="padding:0.5rem 1.5rem;background:#b00;color:#fff;border:none;border-radius:4px;cursor:pointer;">领班解锁</button> ' +
                '<button onclick="document.dispatchEvent(new CustomEvent(\'cocoaAnomaly\'))" style="padding:0.5rem 1.5rem;background:#e67e22;color:#fff;border:none;border-radius:4px;cursor:pointer;margin-left:0.5rem;">记录异常</button>' +
                '</div>' +
                '</div></div>';

            if (!document.getElementById("__lockOverlay")) {
                var oDiv = document.createElement("div");
                oDiv.innerHTML = sHtml;
                document.body.appendChild(oDiv.firstChild);
            }

            document.addEventListener("cocoaUnlock", this._handleUnlockEvent.bind(this));
            document.addEventListener("cocoaAnomaly", this._handleAnomalyEvent.bind(this));
        },

        _removeLockOverlay: function () {
            var oOverlay = document.getElementById("__lockOverlay");
            if (oOverlay) {
                oOverlay.parentNode.removeChild(oOverlay);
            }
            document.removeEventListener("cocoaUnlock", this._handleUnlockEvent);
            document.removeEventListener("cocoaAnomaly", this._handleAnomalyEvent);
        },

        _handleUnlockEvent: function () {
            this.onShowUnlockDialog();
        },

        _handleAnomalyEvent: function () {
            this.onShowAnomalyDialog();
        },

        onShowUnlockDialog: function () {
            this.byId("unlockPassword").setValue("");
            this.byId("btnConfirmUnlock").setEnabled(false);
            this.byId("unlockDialog").open();
        },

        onCloseUnlockDialog: function () {
            this.byId("unlockDialog").close();
        },

        onUnlockPasswordChange: function (oEvent) {
            this.byId("btnConfirmUnlock").setEnabled(!!oEvent.getParameter("value"));
        },

        onUnlock: function () {
            var sInput = this.byId("unlockPassword").getValue();
            var sCorrect = this._oRuntimeModel.getProperty("/supervisorPassword");

            if (sInput === sCorrect) {
                this._oRuntimeModel.setProperty("/isLocked", false);
                this._oRuntimeModel.setProperty("/isAlarm", false);
                this._oRuntimeModel.setProperty("/lockReason", "");
                this._stopAlarm();
                this._removeLockOverlay();
                this.byId("unlockDialog").close();
                MessageToast.show(this._oBundle.getText("unlockSuccess"));
            } else {
                MessageBox.error(this._oBundle.getText("unlockFailed"), { title: "解锁失败" });
                this.byId("unlockPassword").setValue("");
                this.byId("btnConfirmUnlock").setEnabled(false);
            }
        },

        onShowAnomalyDialog: function () {
            this.byId("anomalyReasonSelect").setSelectedKey("E001");
            this.byId("anomalyRemark").setValue("");
            this.byId("photoStatus").setText("尚未拍照");
            this.byId("anomalyPhoto").setVisible(false).setSrc("");
            this.byId("anomalyDialog").open();
        },

        onCloseAnomalyDialog: function () {
            this.byId("anomalyDialog").close();
        },

        onCapturePhoto: function () {
            var oInput = document.getElementById(this.createId("fileUploader"));
            if (oInput) oInput.click();
        },

        onPhotoUploaded: function (oEvent) {
            var oInput = oEvent.getSource && oEvent.getSource().getDomRef
                ? oEvent.getSource().getDomRef()
                : (oEvent.target || document.getElementById(this.createId("fileUploader")));
            var oFile = oInput && oInput.files && oInput.files[0];
            if (!oFile) return;
            var oReader = new FileReader();
            oReader.onload = function (e) {
                var sDataUrl = e.target.result;
                this.byId("anomalyPhoto").setSrc(sDataUrl).setVisible(true);
                this.byId("photoStatus").setText("已拍照留档");
            }.bind(this);
            oReader.readAsDataURL(oFile);
        },

        onSubmitAnomaly: function () {
            var oSelect = this.byId("anomalyReasonSelect");
            var sCode = oSelect.getSelectedKey();
            if (!sCode) {
                MessageBox.warning("请选择异常原因码（E001-E010），监管要求异常追溯必须关联原因码。", {
                    title: "异常留痕校验"
                });
                return;
            }
            var sDescription = "";
            var aReasons = this._oDataModel.getProperty("/reasonCodes");
            var oReason = aReasons.find(function (r) { return r.code === sCode; });
            if (oReason) sDescription = oReason.description;

            var sRemark = this.byId("anomalyRemark").getValue();

            var sPhoto = this.byId("anomalyPhoto").getSrc() || "";
            if (!sPhoto || sPhoto.length < 50) {
                MessageBox.warning("请拍摄或上传异常现场照片，监管要求拍照留档后异常方可入表。", {
                    title: "异常留痕校验"
                });
                return;
            }

            var oRecord = {
                time: new Date().toLocaleTimeString(),
                code: sCode,
                description: sDescription + (sRemark ? "（" + sRemark + "）" : ""),
                temp: (this._oRuntimeModel.getProperty("/currentTemperature") || 0).toFixed(1),
                speed: Math.round(this._oRuntimeModel.getProperty("/currentSpeed") || 0),
                photo: sPhoto,
                timestamp: new Date().toISOString()
            };

            var aRecords = this._oRuntimeModel.getProperty("/anomalyRecords") || [];
            aRecords.unshift(oRecord);
            this._oRuntimeModel.setProperty("/anomalyRecords", aRecords);

            this.byId("anomalyDialog").close();
            MessageToast.show(this._oBundle.getText("anomalyReported"));
        },

        onExportData: function () {
            var aCurve = this._oRuntimeModel.getProperty("/curveData") || [];
            var aAnomalies = this._oRuntimeModel.getProperty("/anomalyRecords") || [];
            var sRecipeId = this._oRuntimeModel.getProperty("/currentRecipeId");
            var sBatch = this._oRuntimeModel.getProperty("/currentBatchNo");

            var sHeader = "批次号," + (sBatch || "") + "\n配方ID," + (sRecipeId || "") + "\n开始时间," + (this._oRuntimeModel.getProperty("/startTime") || "") + "\n\n";

            var sCsv = sHeader + "=== 曲线数据 ===\n时间(秒),温度(°C),转速(RPM),温度下限,温度上限\n";
            aCurve.forEach(function (row) {
                sCsv += row.time + "," + row.temp + "," + row.speed + "," + (row.tempLower || "") + "," + (row.tempUpper || "") + "\n";
            });

            sCsv += "\n=== 异常记录 ===\n时间,原因码,描述,温度,转速\n";
            aAnomalies.forEach(function (r) {
                sCsv += r.timestamp + "," + r.code + ",\"" + r.description + "\"," + r.temp + "," + r.speed + "\n";
            });

            if (this._currentRecipe && this._currentRecipe.standardCurve) {
                sCsv += "\n=== 标准曲线模板 ===\n时间(秒),温度(°C),转速(RPM)\n";
                this._currentRecipe.standardCurve.forEach(function (row) {
                    sCsv += row.time + "," + row.temp + "," + row.speed + "\n";
                });
            }

            var oBlob = new Blob(["\uFEFF" + sCsv], { type: "text/csv;charset=utf-8;" });
            var sUrl = URL.createObjectURL(oBlob);
            var oLink = document.createElement("a");
            oLink.href = sUrl;
            oLink.download = "调温曲线_" + (sBatch || "未命名") + "_" + new Date().toISOString().slice(0, 10) + ".csv";
            document.body.appendChild(oLink);
            oLink.click();
            document.body.removeChild(oLink);
            URL.revokeObjectURL(sUrl);

            MessageToast.show(this._oBundle.getText("exportSuccess"));
        },

        onToggleNightMode: function () {
            var bNight = !this._oRuntimeModel.getProperty("/isNightMode");
            this._oRuntimeModel.setProperty("/isNightMode", bNight);

            if (bNight) {
                document.body.classList.add("nightMode");
                sap.ui.getCore().applyTheme("sap_horizon_dark");
            } else {
                document.body.classList.remove("nightMode");
                sap.ui.getCore().applyTheme("sap_horizon");
            }
            this._drawChart();
        },

        onExit: function () {
            if (this._simulationTimer) {
                clearInterval(this._simulationTimer);
            }
            this._stopAlarm();
            this._removeLockOverlay();
        }
    });
});
