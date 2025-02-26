/*global $, Input, KeyboardModes, model, LANG_JSON_DATA, messagesMenu, tau, DialogsProgress, Utils, createScroller, showLoad, Log*/
/*jshint unused: false*/
/*jslint laxbreak: true*/

Messages.REFRESH_DIALOG_DELAY = 2000;

function Messages(client, messagesMenu) {
    var conversationUser = null, fname = "", lname = "", self = this, refreshInterval = null, getDialogsInterval = null;

    Object.defineProperty(this, 'messagesMenu', {
        get: function () {
            return messagesMenu;
        }
    });

    Object.defineProperty(this, 'client', {
        get: function () {
            return client;
        }
    });

    Object.defineProperty(this, 'firstName', {
        get: function () {
            return fname;
        },
        set: function (val) {
            fname = val;
        }
    });

    Object.defineProperty(this, 'lastName', {
        get: function () {
            return lname;
        },
        set: function (val) {
            lname = val;
        }
    });

    Object.defineProperty(this, 'conversationUser', {
        get: function () {
            return conversationUser;
        },
        set: function (user) {
            conversationUser = user;
        }
    });

    var messagesPage = $('#messagesPage');
    messagesPage.on('pageshow', function () {
        if (refreshInterval !== null) {
            clearInterval(refreshInterval);
            refreshInterval = null;
        }
        refreshInterval = setInterval(function () {
            self.updateDialog(self.conversationUser, true);
        }, Messages.REFRESH_DIALOG_DELAY);
    });

    messagesPage.on('pagebeforehide', function () {
        clearInterval(refreshInterval);
        refreshInterval = null;
        $('#messagesContent').empty();
    });

    var dialogsPage = $('#dialogsPage');
    dialogsPage.on('pageshow', function () {
        getDialogsInterval = setInterval(function () {
            self.loadDialogs('noOpen');
        }, Messages.REFRESH_DIALOG_DELAY);
    });

    dialogsPage.on('pagebeforehide', function () {
        clearInterval(getDialogsInterval);
    });
}

Messages.prototype.scrollMessagesBottom = function () {
    var content = $('#messagesContent'), l = $("#messagesContent div"), height = 0;
    for (var i = 0; i < l.length; i++) {
        height += l.eq(i).height() + 50;
    }
    content.parent().scrollTop(height + 50);
    content.scrollTop(height + 50);
};

Messages.prototype.appendDialogMessages = function (messageUser, messages, noScroll) {
    var self = this, list = $("#messagesContent"), height = 0, item = null, scrollMessages = function () {
        if (noScroll === true) {
            // $('#messagesContent').parent().scrollTop(initScroll);
            // $('#messagesContent').scrollTop(initScroll);
            return;
        }
        self.scrollMessagesBottom();
    }, listChanged = false;

    // list.empty();
    for (var i = messages.items.length - 1; i >= 0; i -= 1) {
        var msg = messages.items[i];
        // noinspection JSUnresolvedVariable
        if (msg.from_id) {

            var bodyText = "", userName = "";

            if (!this.client.user || msg.from_id !== this.client.user.id) {
                if (messageUser.type) {
                    userName = messageUser.name;
                } else {
                    // noinspection JSUnresolvedVariable
                    userName = messageUser.first_name + " " + messageUser.last_name;
                }
            } else {
                // noinspection JSUnresolvedVariable
                userName = this.client.user.first_name + " " + this.client.user.last_name;
            }

            if (msg.text && msg.text !== '') {
                bodyText = msg.text;
            }

            if (msg.attachments && msg.attachments.length > 0) {
                bodyText += this.getHtmlContentFromAttachment(msg.attachments);
                if (msg.attachments.length > 1) {
                    bodyText += '<br><br>' + LANG_JSON_DATA.HAS_MORE_ATTACHMENTS;
                }

            }

            // noinspection JSUnresolvedVariable
            if (msg.fwd_messages && msg.fwd_messages.length > 0) {
                if (bodyText !== '') {
                    bodyText += '<br>>>>' + msg.fwd_messages[0].text;
                } else {
                    bodyText = '>>>' + msg.fwd_messages[0].text;
                }

                if (msg.fwd_messages[0].attachments && msg.fwd_messages[0].attachments.length > 0) {
                    bodyText += this.getHtmlContentFromAttachment(msg.fwd_messages[0].attachments);
                    if (msg.fwd_messages[0].attachments.length > 1) {
                        bodyText += '<br><br>' + LANG_JSON_DATA.HAS_MORE_ATTACHMENTS;
                    }
                }
            }

            if (msg.attachments && msg.attachments.length > 0) {
                switch (msg.attachments[0].type) {
                    case "wall":
                        // noinspection JSUnresolvedVariable
                        if (msg.attachments[0].wall.text.length > 100) {
                            // noinspection JSUnresolvedVariable
                            bodyText += ' ' + msg.attachments[0].wall.text.substring(0, 100) + "...";
                        } else {
                            // noinspection JSUnresolvedVariable
                            bodyText += ' ' + msg.attachments[0].wall.text;
                        }
                        break;
                }
            } else {
                // noinspection JSUnresolvedVariable
                if (msg.action_text) {
                    bodyText += ' ' + msg.action_text;
                }
            }

            // noinspection JSUnresolvedVariable
            if (msg.from_id === this.client.user.id) {
                // noinspection JSCheckFunctionSignatures
                item = $('<div class="right-bubble-parent" id="' + msg.id + '">' + '<span class="right-name-bubble">' + userName + '</span>' + '<span class="right-date-bubble">' + new Date(msg.date * 1000).toDisplayDateTime() + '</span>' + '<div class="right-bubble">'
                    + bodyText + '</div></div>');
            } else {
                // noinspection JSCheckFunctionSignatures
                item = $('<div class="left-bubble-parent" id="' + msg.id + '">' + '<span class="left-name-bubble">' + userName + '</span>' + '<span class="left-date-bubble">' + new Date(msg.date * 1000).toDisplayDateTime() + '</span>' + '<div class="left-bubble">'
                    + bodyText + '</div></div>');
            }

            if ($('#messagesContent #' + msg.id).length === 0) {
                list.append(item);
                height += item.height() + 100;
                listChanged = true;
                self.scrollMessagesBottom();
            }
        }
    }

    if (listChanged) {
        $('#dialogsPage ' + '#' + messageUser.id + '_unread').remove();

    }

    if (Utils.getActivePage() !== 'messagesPage' && Input.isInputPage() === false && messagesMenu.isOpened === false && Utils.getActivePage() !== 'smallProcessingPage') {
        // tau.changePage("#messagesPage");
    } else {
        scrollMessages();
    }
};

Messages.prototype.updateDialog = function (user, noScroll) {
    var self = this, d = $.Deferred();

    if (!user) {
        d.reject();
        return;
    }
    this.conversationUser = user;

    // noinspection JSUnresolvedVariable
    $('#messagesPage h2').html(user.first_name ? user.first_name : '' + ' ' + user.last_name ? user.last_name : '' + user.name ? user.name : '');
    $('#messagesPage').one('pageshow', function () {
        self.scrollMessagesBottom();
    });

    this.client.getHistory(user).then(function (messages) {
        self.appendDialogMessages(user, messages, noScroll);
        d.resolve();
    });

    return d.promise();
};

Messages.prototype.openDialog = function (user) {
    var self = this;

    showLoad(LANG_JSON_DATA.LOADING_MESSAGES);
    self.updateDialog(user).then(function () {
        tau.changePage('#messagesPage');
    });

};

Messages.prototype.refreshMessage = function () {
    this.openDialog(this.conversationUser);
};

Messages.prototype.answerMessage = function () {
    var self = this, input = new Input(model);

    input.open("", LANG_JSON_DATA.ENTER_MESSAGE, KeyboardModes.NORMAL, function (txt) {
        // noinspection JSUnresolvedVariable
        self.client.sendMessage(self.conversationUser.id, txt, self.peer_id).then(function () {

            // noinspection JSUnresolvedVariable
            $("#dialogsPage #" + self.messageUserId + " span").eq(1).html(txt);

            $('#messagesPage').one('pagebeforeshow', function () {
                self.scrollMessagesBottom();
            });

        });
    }, function () {
    }, function (e) {
        if (e === "Please, install TypeGear from store. It's free.") {
            alert(LANG_JSON_DATA.NO_TYPEGEAR);
        } else {
            alert(e);
        }
    });
};

Messages.prototype.getHtmlContentFromAttachment = function (att) {
    switch (att[0].type) {
        case 'photo':
            return '<img alt="" class="messagePhoto" src="' + this.client.getAttachmentSmallPreview(att[0]) + '">';
        case 'video':
            return LANG_JSON_DATA.VIDEOS;
        case 'audio':
            return LANG_JSON_DATA.MUSIC;
        case 'doc':
            return LANG_JSON_DATA.DOCS;
        case 'gift':
            // noinspection JSUnresolvedVariable
            return '<img alt="" class="messagePhoto" src="' + att[0].gift.thumb_96 + '">';
        default:
            return LANG_JSON_DATA.ATTACHMENT_S;
    }
};

Messages.prototype.loadDialogs = function (noOpen) {
    var self = this, textFromAtt = function (att) {
        switch (att[0].type) {
            case 'photo':
                return LANG_JSON_DATA.PHOTOS;
            case 'video':
                return LANG_JSON_DATA.VIDEOS;
            case 'audio':
                return LANG_JSON_DATA.MUSIC;
            case 'doc':
                return LANG_JSON_DATA.DOCS;
            default:
                return LANG_JSON_DATA.ATTACHMENT_S;
        }
    };

    this.client.getDialogs().then(
        function (messages) {
            var i = 0, list = $("#dialogsPage ul").eq(0);
            list.empty();

            if (messages.count === 0) {
                tau.changePage("#main");
                alert(LANG_JSON_DATA.NO_DIALOGS);
            }

            messages.items.forEach(function (item) {
                try {
                    // noinspection JSUnresolvedVariable
                    var unread = item.conversation.unread_count > 0 ? 1 : null, user = null, userName = null, lastMessageText = null;

                    // noinspection JSUnresolvedVariable
                    switch (item.conversation.peer.type) {
                        case 'user':
                            for (i = 0; i < messages.profiles.length; i++) {
                                // noinspection JSUnresolvedVariable
                                if (messages.profiles[i].id === item.conversation.peer.local_id) {
                                    user = messages.profiles[i];
                                    break;
                                }
                            }

                            if (user) {
                                // noinspection JSUnresolvedVariable
                                userName = user.first_name + ' ' + user.last_name;
                            }
                            break;
                        case 'group':
                            for (i = 0; i < messages.groups.length; i++) {
                                // noinspection JSUnresolvedVariable
                                if (messages.groups[i].id === item.conversation.peer.local_id) {
                                    user = messages.groups[i];
                                    break;
                                }
                            }

                            if (user) {
                                userName = user.name;
                            }
                            break;
                    }

                    if (!user) {
                        return;
                    }

                    // noinspection JSUnresolvedVariable
                    lastMessageText = item.last_message.text;

                    // noinspection JSUnresolvedVariable
                    if (!item.last_message.text && item.last_message.attachments && item.last_message.attachments.length > 0) {
                        // noinspection JSUnresolvedVariable
                        lastMessageText = textFromAtt(item.last_message.attachments);
                    }

                    // noinspection JSUnresolvedVariable
                    if (item.last_message && item.last_message.fwd_messages && item.last_message.fwd_messages.length > 0) {
                        lastMessageText = item.last_message.fwd_messages.text;
                        if (item.last_message.fwd_messages[0].attachments && item.last_message.fwd_messages[0].attachments.length > 0) {
                            lastMessageText = textFromAtt(item.last_message.fwd_messages[0].attachments);
                        }
                    }

                    // noinspection JSUnresolvedVariable
                    var it = $(
                        '<li class="li-has-thumb-left li-has-multiline" id="' + item.conversation.peer.id + '">' +
                        '<a href="#">' + userName + " " + user.last_name +
                        '<span class="ui-li-sub-text li-text-sub"></span>' +
                        '<img alt="" src="' + user.photo_50 + '" style="background: rgba(0, 0, 0, 1)" class="ui-li-thumb-left"/>' +
                        '<span class="ui-li-sub-text li-text-sub">' + lastMessageText + '</span>'
                        + (unread ? '<span id="' + item.conversation.peer.id + '"_unread" class="ui-li-sub-text li-text-sub">' + LANG_JSON_DATA.UNREAD + ": " + unread + '</span>' : "") +
                        '</a>' +
                        '</li>');

                    it.on('click', function () {
                        // noinspection JSUnresolvedVariable
                        self.openDialog(user, item.conversation.peer);
                    });

                    if (unread) {
                        it.css('font-weight', 'bold');
                    }

                    list.append(it);
                } catch (err) {
                    var vDebug = "";
                    for (var prop in err) {
                        vDebug += "property: " + prop + " value: [" + err[prop] + "]\n";
                    }
                    vDebug += "toString(): " + " value: [" + err.toString() + "]";

                    alert(vDebug);
                }
            });
            if (!noOpen) {
                tau.changePage("#dialogsPage");
            }
        });
};