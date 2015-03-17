# Opentact SDK for JavaScript

## Overview

This SDK contains wapper code used to communicate with opentact platform.


## Getting started

1. Add script <script data-main="scripts/main" src="scripts/require.js"></script> to html page.
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



