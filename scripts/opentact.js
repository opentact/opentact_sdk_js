
define(['jquery', 'sip', 'mqtt'], function($, sip, mqtt) {
    var version = "v1";
    var host = "192.168.1.28";
    var ws_servers = 'ws://192.168.1.28:10080';
    var sip_server = "192.168.1.28";
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
            var ua;
            var session;
            var options;
            var onRegistered;
            var onDisconnected;
            var onIncoming;

            return {
                register: function(username, password, remoteElement, localElement, onRegisteredCallback, onDisconnectedCallback, onIncomingCallback) {
                    var config = {
                        traceSip: true,
                        uri: username + '@'+ sip_server,
                        ws_servers: ws_servers,
                        authorizationUser: username,
                        password: password,
                        register: true
                    };
                    options = {
                        media: {
                            constraints: {
                                audio: true,
                                video: false
                            },
                            render: {
                                remote: {
                                    video: document.getElementById(remoteElement)
                                },
                                local: {
                                    video: document.getElementById(localElement)
                                }
                            }
                        }
                    };

                    onRegistered = onRegisteredCallback;
                    onDisconnected = onDisconnectedCallback;
                    onIncoming = onIncomingCallback;

                    ua = new sip.UA(config);
                    ua.start();

                    ua.on('invite', function(ss) {
                        session = ss;
                        var from = new RegExp("\"(.*?)\" <.*?>;tag=.*?");
                        var matches = from.exec(session.request.from);
                        var ssid = matches[1];

                        onIncoming(ssid);
                    });
                },
                invite:  function(uri) {
                    session = this.ua.invite(uri, options);
                },
                hangup: function() {
                    session.bye();
                },
                accept: function() {
                    session.accept()
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
                        remoteElement: 'remoteVideo',
                        localElement: 'localVideo',
                        onRegistered: function(){},
                        onDisconnected: function(){},
                        onIncoming: function() {
                            return true;
                        }
                    };

                    options = $.extend({}, defaults, _options || {});

                    var rest = Rest.getInstance();
                    rest.setUserAndPassword(options.sid, options.authToken);

                },
                startUpVoice: function(onRegisteredCallback, onDisconnectedCallback, onIncomingCallback) {
                    var rest = Rest.getInstance();
                    rest.sipAccountBySid(options.ssid, function(data) {
                        ua.register(data.sip_number, data.sip_password, options.remoteElement, options.localElement,
                                    onRegisteredCallback, onDisconnectedCallback, onIncomingCallback);

                    });
                },
                startIM: function(incomingCallback) {
                    im = IM.getInstance();
                    im.register(im_server, options.ssid, options.ssid, options.authToken, "opetact/" + options.sid + "/" + options.ssid,
                                incomingCallback);
                },
                sendMessage: function(message, sid) {
                    im = IM.getInstance();
                    im.sendMessage(message, "opentact/" + options.sid + "/" + sid);
                },
                makeCallToSid:function(sid) {
                    var rest = Rest.getInstance();
                    rest.sipAccountBySid(sid, function(data) {
                        ua.invite("sip:11111@" + data.sip_number + "@" + sip_server);
                    });
                },
                makeCallToTermination:function(number)
                {
                    var rest = Rest.getInstance();
                    rest.sipAccountBySid(sid, function(data) {
                        ua.invite("sip:99999@" + number + "@" + sip_server);
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