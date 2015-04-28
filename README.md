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
        // Get singleton instance
        var sdk = opentact.SDK.getInstance();
        var rest = opentact.Rest.getInstance();

        // Set options
        var options = {sid: '54ddd9e6afd12966c2ea9589',
            ssid: '54e05227afd12909af009c5e',
            authToken: '88e77509bd0e4dc89b8e915a8db25ebe',
            remoteElement: 'remoteVideo',
            localElement: 'localVideo',
            onRegistered: function(){},
            onDisconnected: function(){},
            onIncoming: function() {}};

        sdk.setOptions(options);

        // Start Voice
        sdk.startUpVoice(function() {
            // OnRegistered callback
        }, function() {
            // OnDisconnected
        }, function(sid) {
            // OnIncoming callback

            // answer the incoming call
            sdk.answerCall();
        });

        // make a call to sid
        sdk.makeCallToSid("54e05211afd12909af009c5c");

        // send message to sid
        sdk.sendMessage({
            message: "hello",
            timestamp: new Date(),
            type: "text/plain",
            fsid: options.ssid
        }, "54e05211afd12909af009c5c");

    });
