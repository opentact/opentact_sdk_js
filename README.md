# Opentact SDK for JavaScript

## Overview

This SDK contains wapper code used to communicate with opentact platform.


## Getting started

1. Add script `<script data-main="scripts/main" src="scripts/require.js"></script>` to html page.
2. Edit script/main.js.

## Configuration

    var options = {sid: '',
        ssid: '',
        authToken: '',
        remoteElement: 'remoteVideo',
        localElement: 'localVideo',
        onRegistered: function(){},
        onDisconnected: function(){},
        onIncoming: function() {
            return true;
    }};

## Usage

    require(["opentact"], function(opentact) {
        var sdk = opentact.SDK.getInstance();
        var rest = opentact.Rest.getInstance();

        var options = {sid: '55288821afd1293a0540a3d4',
            ssid: '552888a9afd129390300f9fc',
            authToken: '875f27edf68d4d79adf1e803a891ae2e',
            audioRemoteElement: 'audio-remote',
            videoRemoteElement: 'video-remote',
            videoLocalElement: 'video-local'};

        sdk.setOptions(options);

        sdk.startUpVoice(function() {
            // OnRegistered callback

            // now make a call to sid
            sdk.makeCallToSid("552888afafd129390300f9fe");
        }, function() {
            // OnDisconnected
        }, function(sid) {
            // OnIncoming callback

            // answer the incoming call
            sdk.answerCall();
        });

        sdk.startIM(function() {

        });

        // send message to sid
        sdk.sendMessage({
            message: "hello",
            timestamp: new Date(),
            type: "text/plain",
            fsid: options.ssid
        }, "54e05211afd12909af009c5c");

    });