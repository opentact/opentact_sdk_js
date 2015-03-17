require(["opentact"], function(opentact) {
    var sdk = opentact.SDK.getInstance();
    var rest = opentact.Rest.getInstance();

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

    sdk.setOptions();

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
    sdk.makeCallToSid("1234564ssrerer455");

    // send message to sid
    sdk.sendMessage({"message": "hello"}, "1234564ssrerer455");

});