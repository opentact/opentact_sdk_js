
define(['jquery', 'SIPml-api', 'mqtt'], function($, sip, mqtt) {
    var version = "v1";
    var host = "192.168.1.28";
    var ws_server = 'ws://192.168.1.28:10060';
    var sip_server = "192.168.1.6:6060";
    var im_server = "192.168.1.28";

    var Rest = (function(){
        // Instance stores a reference to the Singleton
        var instance;

        function init() {
            // private property
            var baseUrl = "https://" + host + "/" + version + "/";
            var type = ".json";
            var username = "";
            var password = "";

            // Private methods and variables
            function request(uri, method, data) {
                return $.ajax({
                    url: baseUrl + uri + type,
                    type: method,
                    cache: false,
                    data: data,
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader("Authorization",
                            "Basic " + btoa(username + ":" + password));
                    }
                });
            }

            return {
                setUserAndPassword: function(u, p) {
                    username = u;
                    password = p;
                },
                subAccountBySid:function(sid, callback) {
                    request("accounts/" + sid, "GET").done(function(data) {
                        callback(data);
                    });
                },
                sipAccountBySid:function(sid, callback) {
                    request("accounts/" + sid + "/sip", "GET").done(function(data) {
                        callback(data);
                    });
                },
                imAccountBySid:function(sid, callback) {
                    request("accounts/" + sid + "/im", "GET").done(function(data) {
                        callback(data);
                    });
                },
                sipAccountByNumber:function(number, callback) {
                    request("numbers/" + number, "GET").done(function(data) {
                        callback(data);
                    });
                },
                createSubAccountWithName:function(name, callback) {
                    request("accounts", "POST", {name:name}).done(function(data) {
                        callback(data);
                    });
                }
            };
        }

        return {
            getInstance: function() {
                if (!instance) {
                    instance = init();
                }
                return instance;
            }
        };
    })();


    var UA = (function() {
        var instance;

        function init() {
            var sipStack;
            var session;

            var onRegistered;
            var onDisconnected;
            var onIncoming;


            var login = function() {
                registerSession = sipStack.newSession('register', {
                    events_listener: {events: '*', listener: eventsListener}
                });
                registerSession.register();
            };

            var acceptCall = function(e) {
                session = e.newSession;
                var remoteUri = session.getRemoteFriendlyName();
                var rest = Rest.getInstance();
                rest.sipAccountByNumber(remoteUri, function(data) {
                    onIncoming(data.sid)
                });
                // e.newSession.accept();
                // e.newSession.reject() to reject the call
            };

            function eventsListener(e) {
                console.info("Status: " + e.type);

                if (e.type == 'started') {
                    // ready for registering
                    login();
                } else if(e.type == 'i_new_call') {
                    // incoming audio/video call
                    acceptCall(e);
                } else if (e.type == 'connected' && e.session == registerSession) {
                    // registered
                    //makeCall();
                    onRegistered();
                }  else if (e.type == 'stopped') {
                    // stopped
                    onDisconnected();
                }
            }

            return {
                register: function(username, password, audioRemoteElement, videoRemoteElement, videoLocalElement, onRegisteredCallback, onDisconnectedCallback, onIncomingCallback) {

                    SIPml.init(function(e) {
                        sipStack = new SIPml.Stack({
                                realm: sip_server, // mandatory: domain name
                                impi: username, // mandatory: authorization name (IMS Private Identity)
                                impu: 'sip:' + username + '@' + sip_server, // mandatory: valid SIP Uri (IMS Public Identity)
                                password: password, // optional
                                display_name: username, // optional
                                websocket_proxy_url: ws_server, // optional
                                outbound_proxy_url: 'udp://' + sip_server, // optional
                                enable_rtcweb_breaker: true, // optional
                                events_listener: { events: '*', listener: eventsListener }, // optional: '*' means all events
                                sip_headers: [ // optional
                                        { name: 'User-Agent', value: 'web-client opentact v0.1' },
                                        { name: 'Organization', value: 'Opentact' }
                                ]
                            }
                        );

                        sipStack.start();
                    }, function(e){
                        console.error('Failed to initialize the engine: ' + e.message);
                    });

                    onRegistered = onRegisteredCallback;
                    onDisconnected = onDisconnectedCallback;
                    onIncoming = onIncomingCallback;

                    audioRemote = audioRemoteElement;
                    videoRemote = videoRemoteElement;
                    videoLocal = videoLocalElement;


                },
                invite:  function(uri) {
                    session = sipStack.newSession('call-audio', {
                        video_local: document.getElementById(videoLocal),
                        video_remote: document.getElementById(videoRemote),
                        audio_remote: document.getElementById(audioRemote),
                        events_listener: { events: '*', listener: eventsListener },
                        sip_caps: [
                            { name: '+g.oma.sip-im' },
                            { name: 'language', value: '\"en,fr\"' }
                        ]
                    });

                    session.call(uri);
                },
                hangup: function() {
                    session.hangup();
                },
                accept: function() {
                    session.accept()
                },
                reject: function() {
                    session.reject();
                }
            };
        }

        return {
            getInstance: function() {
                if (!instance) {
                    instance = init();
                }
                return instance;
            }
        };
    })();


    var IM = (function() {
        var instance;
        var client;

        function onConnect(topic){
            client.subscribe(topic);
        }

        function init() {
            return {
                register: function(host, clientId, username, password, topic, incomingMessageCallback) {
                    client = new Paho.MQTT.Client(host, 1883, clientId);
                    client.onConnectionLost = function(responseObject) {
                        if (responseObject.errorCode != 0) {
                            client.connect({onSuccess: function() {
                                client.subscribe(topic, {qos: 1});
                            }});
                        }
                    };
                    client.onMessageArrived = function(message) {
                        data = JSON.parse(message);
                        incomingMessageCallback(data);
                    };

                    client.connect({cleanSession: false, onSuccess: function() {
                        client.subscribe(topic);
                    }});
                },
                sendMessage: function(message, topic) {
                    data = JSON.stringify(message);
                    message = new Paho.MQTT.Message(data);
                    message.destinationName = topic;
                    message.qos = 1;
                    client.send(message);
                }
            };
        }

        return {
            getInstance: function() {
                if (!instance) {
                    instance = init();
                }
                return instance;
            }
        };
    })();


    var SDK = (function() {
        var instance;
        var options;

        function init() {
            var ua = UA.getInstance();
            var rest = Rest.getInstance();
            var im = IM.getInstance();


            return {
                setOptions: function(_options) {
                    var defaults = {
                        sid: '',
                        ssid: '',
                        authToken: '',
                        audioRemoteElement: 'audio_remote',
                        videoRemoteElement: 'video_remote',
                        videoLocalElement: 'video_local'
                    };

                    options = $.extend({}, defaults, _options || {});

                    var rest = Rest.getInstance();
                    rest.setUserAndPassword(options.sid, options.authToken);

                },
                startUpVoice: function(onRegisteredCallback, onDisconnectedCallback, onIncomingCallback) {
                    var rest = Rest.getInstance();
                    rest.sipAccountBySid(options.ssid, function(data) {
                        ua.register(data.sip_number, data.sip_password, options.audioRemoteElement,
                                    options.videoRemoteElement, options.videoLocalElement,
                                    onRegisteredCallback, onDisconnectedCallback, onIncomingCallback);

                    });

                },
                startIM: function(incomingCallback) {
                    im = IM.getInstance();
                    im.register(im_server, options.ssid, options.ssid, options.authToken, "opentact/" + options.sid + "/" + options.ssid,
                                incomingCallback);
                },
                sendMessage: function(message, sid) {
                    im = IM.getInstance();
                    im.sendMessage(message, "opentact/" + options.sid + "/" + sid);
                },
                makeCallToSid:function(sid) {
                    var rest = Rest.getInstance();
                    rest.sipAccountBySid(sid, function(data) {
                        ua.invite("sip:11111" + data.sip_number + "@" + sip_server);
                    });
                },
                makeCallToTermination:function(number)
                {
                    var rest = Rest.getInstance();
                    rest.sipAccountBySid(sid, function(data) {
                        ua.invite("sip:99999" + number + "@" + sip_server);
                    });
                },
                endCall: function() {
                    ua.hangup();
                },
                answerCall: function() {
                    ua.accept();
                }
            };
        }


        return {
            getInstance: function() {
                if (!instance) {
                    instance = init();
                }
                return instance;
            }
        };
    })();


    return {
        SDK: SDK,
        Rest: Rest
    };
});