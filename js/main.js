/*global SAP, $, ActionMenu, Messages, LANG_JSON_DATA, ContentManagement, VirtualList, Dirs, FilesAction, tizen, VKClient, Utils, tau, GearHttp, KeyboardModes, Input, ActionPopup, CircleProgress, ToastMessage, Log, createScroller, Sections*/
/*jshint unused: false*/
/*jslint laxbreak: true*/

var sap = null;
var model = null;
var client = null;
var messagesMenu = null;
var settingsMenu = null;
var activeFeedId = null;
var friendsStack = [];
var currentUserId = null;
var toastMessage = null;
var messages = null;
var currentPostIndex = 0;
var sections = null;

function openMessagesMenu() {
    messagesMenu.show();
}

function exitApp() {
    sap.close();
    tizen.application.getCurrentApplication().exit();
}

function showLoad(msg) {
    $("#smallProcessingDescription").html(msg);
    tau.changePage("#smallProcessingPage");
}

/*******************************************************************************
 ******************************************************************************/

function openLink(url) {
    sap.openLinkOnPhone(url);
}

function playStart(id) {
    var players = $("audio");

    for (var i = 0; i < players.length; i += 1) {
        if (players.eq(i).prop("id") !== id) {
            // noinspection JSCheckFunctionSignatures
            players.eq(i).trigger("pause");
        }
    }
}

function openFeedItem(id) {
    createFeedFullItem(id, '#feedFullPage', '#feedFullList', '#feedFullText');
}

function createFeedFullItem(id, pageName, listName, textName, small) {
    var item = client.feed.getItemById(id), list = $(listName), from = null,
        att = client.getFeedItemAttachments(item), text = client.getFeedItemText(item);

    $(pageName + ' img').attr('src', '');

    $(pageName + ' div').attr('id', id);

    activeFeedId = id;

    // noinspection JSUnresolvedVariable
    if (item && item.source_id) {
        from = client.feed.getOwnerById(item.source_id);
    }

    if (from) {
        $(pageName + ' h2').html(from.name);
    } else {
        $(pageName + ' h2').hide();
    }

    list.empty();

    if (!text || text === '') {
        $(textName).hide();
    } else {
        $(textName).show();
    }
    $(textName).prop("src", 'data:text/html;charset=utf-8,' + encodeURIComponent('<html lang="en"><body style="word-wrap: break-word; color:white; font-size:2em; height: 100%"><div>' + text + "</div></body></html>"));

    for (var i = 0; i < att.length; i += 1) {
        switch (att[i].type) {
            case "photo":
                var img = small ? client.getAttachmentSmallPreview(att[i]) : client.getAttachmentLargePreview(att[i]);
                list.append('<li class="li-has-multiline"><img alt="" class="vkPhoto" src="' + img + '"/></li>');
                break;
            case "audio":
                // noinspection JSUnresolvedVariable
                list.append(
                    '<li class="li-has-multiline">' +
                    '<audio style="width: 100%" controls onplay="playStart(id)" src="' + att[i].audio.url + '" id="' + att[i].audio.id + '"></audio>' +
                    '<span class="ui-li-sub-text li-text-sub">' +
                    '<div class="ui-marquee ui-marquee-gradient" style="height:100px;line-height:100px" id="' + "m_" + att[i].audio.id + '">' + att[i].audio.artist + " - " + att[i].audio.title + '</div>' +
                    '</span>' +
                    '</li>');
                (function (id) {
                    $(pageName).one("pageshow", function () {
                        var marqueWidget = new tau.widget.Marquee(document.getElementById("m_" + id), {
                            autoRun: true,
                            iteration: "infinite"
                        });

                        (function (m) {
                            $(pageName).one("pagehide", function () {
                                if (m) {
                                    m.destroy();
                                }
                            });
                        })(marqueWidget);
                    });
                })(att[i].audio.id);
                break;
            case "link":
                list.append('<li class="li-has-multiline" onclick="openLink(\'' + att[i].link.url + '\')"><a href="#">' + LANG_JSON_DATA.OPEN_LINK + '<span class="ui-li-sub-text li-text-sub">' + LANG_JSON_DATA.ON_PHONE + '</span></a></li>');
                break;
            case "video":
                if (att[i].video.player) {
                    list.append('<li class="li-has-multiline" onclick="openLink(\'' + att[i].video.player + '\')"><a href="#">' + LANG_JSON_DATA.VIDEOS + '<span class="ui-li-sub-text li-text-sub">' + LANG_JSON_DATA.ON_PHONE + '</span></a></li>');
                } else {
                    list.append('<li class="li-has-multiline"><a href="#">' + LANG_JSON_DATA.OPEN_VIDEO + '<span class="ui-li-sub-text li-text-sub">' + LANG_JSON_DATA.UNAVAILABLE + '</span></a></li>');
                }
                break;
            case "note":
                list.append('<li class="li-has-multiline"><a href="#">' + LANG_JSON_DATA.NOTES + '<span class="ui-li-sub-text li-text-sub">' + LANG_JSON_DATA.UNSUPPORTED + '</span></a></li>');
                break;
            case "poll":
                list.append('<li class="li-has-multiline"><a href="#">' + LANG_JSON_DATA.POLLS + '<span class="ui-li-sub-text li-text-sub">' + LANG_JSON_DATA.UNSUPPORTED + '</span></a></li>');
                break;
            case "page":
                // noinspection JSUnresolvedVariable
                list.append('<li class="li-has-multiline" onclick="openLink(\'' + att[i].page.view_url + '\')"><a href="#">' + LANG_JSON_DATA.OPEN_PAGE + '<span class="ui-li-sub-text li-text-sub">' + LANG_JSON_DATA.ON_PHONE + '</span></a></li>');
                break;
            case "doc":
                list.append('<li class="li-has-multiline"><img alt="" id="postPic" class="vkPhoto" src="' + att[i].doc.url + '"/>/li>');
                break;
        }

    }

    tau.changePage(pageName);
}

function onfeed(feed) {
    createFeedFullItem(feed.items[currentPostIndex].post_id, '#feedPage', '#feedList', '#feedText', true);
}

function feedClick() {
    showLoad(LANG_JSON_DATA.LOADING_FEED);
    $("#feedPage ul").empty();
    client.getFeed(null).then(onfeed, onfeed);
}

function fillUserInfo(user) {

    if (!user) {
        alert(LANG_JSON_DATA.USER_INFO_NOT_FOUND);
        return;
    }
    currentUserId = user.id;

    // noinspection JSUnresolvedVariable
    $("#user_name_details").html(user.first_name);

    $("#user_image_details").prop("src", client.getUserPhoto(user));
    // noinspection JSUnresolvedVariable
    $("#user_lastname_details").html(user.last_name);
    // noinspection JSUnresolvedVariable
    if (!user.deactivated) {
        // noinspection JSUnresolvedVariable
        $("#user_bday").html(user.bdate);
        // noinspection JSUnresolvedVariable
        $("#user_friends").html(user.counters.friends);
        $("#user_photos").html(user.counters.photos);
        $("#userPage div").eq(0).css("background-image", "");
    } else {
        $("#userPage div").eq(0).css("background-image", "url(/images/banned.png)");
    }
    tau.changePage("#userPage");
}

function profileClick() {
    if (client.user) {
        fillUserInfo(client.user);
    } else {
        toastMessage.show(LANG_JSON_DATA.LOADING_USER);
    }
}

function openFriend(id) {
    friendsStack.push(id);
    client.getUser(id).then(fillUserInfo);
}

function friendsClick() {

    var id = friendsStack.length < 1 ? client.user.id : friendsStack[friendsStack.length - 1];

    tau.changePage("#smallProcessingPage");
    client.getFriends(id).then(
        function (friends) {
            var list = $("#friendsList");
            list.empty();
            for (var i = 0; i < friends.items.length; i += 1) {
                // noinspection JSUnresolvedVariable
                list.append(
                    '<li onclick="openFriend(this.id)" class="li-has-thumb-left li-has-multiline" id="' + friends.items[i].id + '">' +
                    '<a href="#">' + friends.items[i].first_name +
                    '<span class="ui-li-sub-text li-text-sub"></span>' +
                    '<img alt="" src="' + friends.items[i].photo_50 + '" style="background: rgba(0, 0, 0, 1)" class="ui-li-thumb-left"/>' +
                    '<span class="ui-li-sub-text li-text-sub">' + friends.items[i].last_name + '</span>' +
                    '</a>' +
                    '</li>');
            }

            tau.changePage("#friendsPage");
        });
}

function loadDialogs() {
    showLoad(LANG_JSON_DATA.LOADING_MESSAGES);
    messages.loadDialogs();
}

function onUnreadMessage(count) {
    $('#dialogsButton span').html(LANG_JSON_DATA.DIALOGS + '(' + count + ')');
    navigator.vibrate([300, 250, 300, 250, 300]);
    toastMessage.show(LANG_JSON_DATA.NEW_MESSAGE);
}

function fillUser(user) {
    var userImage = $('#user_image');
    var userImageParent = userImage.parent();

    userImageParent.css('background-image', 'url(' + client.getUserPhoto(user) + ')');
    userImageParent.css('background-position', 'center center');
    userImageParent.css('background-size', 'cover');
    userImage.css('visibility', 'hidden');
    client.getUnreadMessagesCount().then(function (count) {
        $('#dialogsButton span').html(LANG_JSON_DATA.DIALOGS + '(' + count + ')');
        if (client.checkUnread) {
            client.startCheckUnreadMessages(onUnreadMessage);
        }
    });
}

/**
 * Refresh tabs info
 */
function update() {
    try {
        if (!client.isAuthorized) {
            if (sap.isDeviceAttached !== true) {
                alert(LANG_JSON_DATA.NO_HOST_APP);
            }
            client.authneeded();
            return;
        }

        if (client.user) {
            fillUser(client.user);
        }

        client.getUser(null).then(function (user) {
            fillUser(user);
        });
    } catch (e) {
        alert(e);
    }
}

/**
 * Get data from phone
 */
function onreceive(channelId, data) {
    switch (channelId) {
        case SAP.SERVICE_CHANNEL_ID:
            if (data === SAP.AUTH_NEEDED) {
                client.accessToken = '';

                if (!confirm(LANG_JSON_DATA.CONNECT_VK)) {
                    exitApp();
                }
                update(true);
                return;
            }
            $("#feedList").empty();
            client.accessToken = data;
            update(true);
            break;
    }
}

function checkUnreadClick(checkbox) {
    client.checkUnread = checkbox.checked;
    if (checkbox.checked) {
        client.startCheckUnreadMessages(onUnreadMessage);
    } else {
        client.stopCheckUnreadMessages();
    }
}

function translateUi() {

    // $('#main h2').html(LANG_JSON_DATA.NEWS);
    $("#unreadLabel").html(LANG_JSON_DATA.UNREAD);
    $("#loginOkButton").html(LANG_JSON_DATA.OK);
    $("#loginCancelButton").html(LANG_JSON_DATA.CANCEL);
    $('#userNameA').prepend(LANG_JSON_DATA.FIRST_NAME);
    $('#userLastNameA').prepend(LANG_JSON_DATA.LAST_NAME);
    $('#userBDayA').prepend(LANG_JSON_DATA.B_DAY);
    $('#userFriendsA').prepend(LANG_JSON_DATA.FRIENDS);
    $('#userPhotosA').prepend(LANG_JSON_DATA.PHOTOS);
    $("#settingsPage h2").html(LANG_JSON_DATA.SETTINGS);

    $('#userPage h2').html(LANG_JSON_DATA.PROFILE);
    $('#checkUnreadLabel').prepend(LANG_JSON_DATA.CHECK);
    $("#checkUnreadLabel span").html(LANG_JSON_DATA.DIALOGS);
    $('#dialogsPage h2').html(LANG_JSON_DATA.DIALOGS);

    $('#feedButton span').html(LANG_JSON_DATA.NEWS);
    $('#dialogsButton span').html(LANG_JSON_DATA.DIALOGS);
    $('#profileButton span').html(LANG_JSON_DATA.PROFILE);
    $('#settingsButton span').html(LANG_JSON_DATA.SETTINGS);
    $('#friendsPage h2').html(LANG_JSON_DATA.FRIENDS);
}

function createMenus() {
    messagesMenu = new ActionMenu('messagesMenuPage', 'messagesMenuPopup', [{
        name: 'answerMessageMenu',
        title: LANG_JSON_DATA.REPLY,
        image: 'images/reply.png',
        onclick: function () {
            messages.answerMessage();
        }
    }, {
        name: 'refreshMessageMenu',
        title: LANG_JSON_DATA.REFRESH,
        image: 'images/refresh.png',
        onclick: function () {
            messages.refreshMessage();
        }
    }]);

    settingsMenu = new ActionMenu('settingsMenuPage', 'settingsMenuPopup', [{
        name: 'settingsMenu',
        title: LANG_JSON_DATA.SETTINGS,
        image: 'images/settings.png',
        onclick: function () {
            tau.changePage('#settingsPage');
        }
    }]);
}

function settingsClick() {
    tau.changePage('#settingsPage');
}

var timeout = null;
$(window).on('load', function () {

    translateUi();
    Log.DEBUG = false;
    toastMessage = new ToastMessage('#popupToast', '#popupToastMsg');

    var reconnect = function () {
        sap.sendData(SAP.SERVICE_CHANNEL_ID, "OAuthException", reconnect);
    };

    createMenus();

    $("#linkPage progress").hide();
    $("#linkPage").on("load", function () {
        $("#linkPage progress").hide();
    });

    // noinspection JSCheckFunctionSignatures
    document.getElementById("smallProcessingPage").addEventListener("pagehide", function () {
        $("#smallProcessingDescription").html("");
    });

    var x = 0, feedPage = $('#feedPage'), width = feedPage.width();
    width = width - width * 0.5;

    feedPage.on('touchstart', function (event) {
        x = event.originalEvent.touches[0].pageX;
    });

    feedPage.on('touchend', function (event) {
        var pageX = event.originalEvent.changedTouches[0].pageX;

        if (x > pageX && x - pageX > width) {
            if (currentPostIndex < client.feed.items.length - 1) {
                currentPostIndex++;
                onfeed(client.feed);
            }
        }

        if (x < pageX && pageX - x > width) {
            if (currentPostIndex > 0) {
                currentPostIndex--;
                onfeed(client.feed);
            }
        }
    });

    $("#settingsPage").on("pageshow", function () {
        $("#checkUnreadLabel input").prop("checked", client.checkUnread);
    });

    $("#feedFullPage").on("pagebeforehide", function () {
        $("audio").each(function () {
            // noinspection JSCheckFunctionSignatures
            $(this).trigger("pause");
        });
        $("#feedFullList").empty();
    });

    document.addEventListener("rotarydetent", function (e) {
        var el = null;
        switch (Utils.getActivePage()) {
            case "messagesPage":
                el = $("#messagesContent").parent();
                break;
            case "feedFullPage":
                el = $("#feedFullContent").parent();
                break;
            case "feedPage":
                if (e.detail.direction === 'CW') {
                    if (currentPostIndex < client.feed.items.length - 1) {
                        currentPostIndex++;
                    }
                }
                if (e.detail.direction === 'CCW') {
                    if (currentPostIndex > 0) {
                        currentPostIndex--;
                    }
                }
                onfeed(client.feed);
                // el = $("#feedPage .ui-scroller");
                return;
        }
        if (el !== null) {
            if (e.detail.direction === "CW") {

                el.animate({
                    scrollTop: (el.scrollTop() + 150)
                }, 100);
            } else if (e.detail.direction === "CCW") {

                el.animate({
                    scrollTop: (el.scrollTop() - 150)
                }, 100);
            }
        }
    });

    document.addEventListener("visibilitychange", function () {
        if (document.hidden) {
            client.stopCheckUnreadMessages();
        } else {
            if (client.checkUnread) {
                client.startCheckUnreadMessages(onUnreadMessage);
            }
        }
    }, false);

    document.addEventListener('tizenhwkey', function (e) {
        if (e.keyName === "back") {
            if (settingsMenu.isOpened === true) {
                settingsMenu.close();
                return;
            }
            if (messagesMenu.isOpened === true) {
                messagesMenu.close();
                return;
            }
            if (Input.isInputPage() === true) {
                return;
            }
            switch (Utils.getActivePage()) {
                case "friendPage":
                    tau.changePage("#friendsPage");
                    break;
                case "friendsPage":
                    if (friendsStack.length > 0) {
                        tau.changePage("#smallProcessingPage");
                        client.getUser(friendsStack.pop()).then(function (user) {
                            fillUserInfo(user);
                        });
                    } else {
                        profileClick();
                    }
                    break;
                case "messagesPage":
                    tau.changePage("#dialogsPage");
                    break;
                case "linkPage":
                    tau.changePage("#feedFullPage");
                    break;
                case "feedFullPage":
                    onfeed(client.feed);
                    break;
                case "feedPage":
                case "dialogsPage":
                case "settingsPage":
                    tau.changePage("#main");
                    break;
                case "linkWindow":
                    break;
                // VK
                case "userPage":
                    if (currentUserId === client.user.id) {
                        tau.changePage("#main");
                    } else {
                        friendsStack.pop();
                        friendsClick();
                    }
                    break;
                default:
                    exitApp();
                    break;
            }
        }
    });
    var auth = null;
    try {
        sap = new SAP("SocialGearProvider", onreceive, null, function (err) {
            switch (err) {
                case SAP.ERRORS.DEVICE_NOT_CONNECTED:
                    if (client && !client.isAuthorized) {
                        alert(LANG_JSON_DATA.DEVICE_NOT_CONNECTED);
                    }
                    break;
                case SAP.ERRORS.PEER_NOT_FOUND:
                    if (client && !client.isAuthorized) {
                        alert(LANG_JSON_DATA.INSTALL_HOST_APP);
                    }
                    break;
                default:
                    if (client && !client.isAuthorized) {
                        toastMessage.show(err);
                    }
                    break;
            }

        }, function (msg) {
            if (msg === GearHttp.OFFLINE) {
                toastMessage.show(LANG_JSON_DATA.NO_INTERNET);
            }
        });

        sap.connectOnDeviceNotConnected = false;
        sap.connect();
        new GearHttp(sap);
        auth = function () {
            sap.connectOnDeviceNotConnected = true;
            sap.sendData(SAP.SERVICE_CHANNEL_ID, SAP.AUTH_NEEDED);
        };
    } catch (ignore) {
    }
    try {
        client = new VKClient(sap, auth, reconnect, function (err) {
            // noinspection JSUnresolvedVariable
            if (err.error_code === 5) {
                return;
            }
            // noinspection JSUnresolvedVariable
            alert(err.error_msg);
        });
        messages = new Messages(client, messagesMenu);

        update();

        try {
            tizen.systeminfo.getPropertyValue("BUILD", function (res) {
                model = res.model;
                client.model = model;
            });
        } catch (ignore) {
        }

    } catch (e) {
        alert(e);
    }

});