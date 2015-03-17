require(["opentact"], function(opentact) {
    var sdk = opentact.SDK.getInstance();
    var rest = opentact.Rest.getInstance();

    var options = {sid: '54ddd9e6afd12966c2ea9589',
        ssid: '54e05227afd12909af009c5e',
        authToken: '88e77509bd0e4dc89b8e915a8db25ebe',
        remoteElement: 'remoteVideo',
        localElement: 'localVideo',
        onRegistered: function(){},
        onDisconnected: function(){},
        onIncoming: function() {}};

    sdk.setOptions(options);

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