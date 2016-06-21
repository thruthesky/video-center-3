<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>WebRTC Peer Connection</title>
    <link href="css/font-awesome/css/font-awesome.min.css" rel="stylesheet">
    <link href="css/bootstrap/css/bootstrap.min.css" rel="stylesheet">
    <link href="css/base.css" rel="stylesheet">
    <link href="css/layout.css" rel="stylesheet">
    <link href="css/module.css" rel="stylesheet">
    <link href="css/module-video.css" rel="stylesheet">
    <link href="css/module-chat.css" rel="stylesheet">
    <link href="css/module-document.css" rel="stylesheet">
    <link href="css/module-whiteboard.css" rel="stylesheet">
    <link href="css/header.css" rel="stylesheet">
    <link href="css/entrance.css" rel="stylesheet">
    <link href="css/lobby.css" rel="stylesheet">
    <link href="css/room.css" rel="stylesheet">
    <link href="css/whiteboard.css" rel="stylesheet">
    <link href="css/footer.css" rel="stylesheet">
    <link href="css/theme.css" rel="stylesheet">
    <style>
        /**
         *
         *  L A Y O U T    : DON'T DESIGN HERE
         *
         */

        #entrance { padding: 2em; }
        #status { background-color: grey; }
        #room { position: relative; background-color:#5f9ea0; }
        #room .content { position: relative; }

        #room .content .whiteboard { display: none; background-color: #e1e1e1; }

        #room.has-whiteboard .whiteboard { display: block; }




        /** White Board Design */
        #room .content .whiteboard {
            position: relative;
            width: 100%;
            height: 340px;
            background-color: #AEBDCC;
        }
        #room .content .whiteboard nav {
            position: absolute;
            z-index: 500;
            top: 4px;
            right: 4px;
        }
        #room .content .whiteboard section { position: absolute; z-index: -50; top: 0; left: 0; right: 0; bottom: 0; }
        #room .content .whiteboard canvas {
            position:relative;
            z-index: 200;
            width:100%;
            height: 100%;
        }

        /** Layout break point */
        @media all and ( min-width: 546px ){
            #room { background-color: #19469D; }
            #room .videos {
                position: absolute;
                z-index: 100;
            }
            #room.has-whiteboard .content .videos {
                position: relative;
                margin: 0;
            }

            #room .content .whiteboard {
                position: absolute;
                z-index: 100;
                top: 0;
                right: 0;
                width: auto;
            }
        }

        #lobby .room-list {
            margin: .4em 0;
        }
        #lobby .room-list .room {
            margin: .1em 0;
            padding: 1em;
            background-color: #5f9ea0;
            color: white;
        }
        #lobby .room-list .room .name {
            display: block;
            font-weight: bold;
            cursor: pointer;
        }

    </style>
    <script>
        //var serverURL = "https://www.onfis.com:30443/book9/";
        var serverURL = "https://www.videocenter.co.kr/book9/";
        var bookURL = serverURL + 'dir.php';
        // var socketURL = '//www.onfis.com:10443'; // TEST Server
        var socketURL = '//www.videocenter.co.kr:10443'; // Real Server ...
        var video_count = 0;
        function getScript(src) {
            document.write('<' + 'script src="' + src + '"' +
                    ' type="text/javascript"><' + '/script>');
        }
        var src = socketURL + '/socket.io/socket.io.js';
        getScript( src );
    </script>
</head>
<body>
<script type="text/template" id="template">

    <header>
        <div class="caption">
            Video Center v3 by Withcenter, Inc.
        </div>
        <nav class="header-menu">
            <div>
                <a href="../index.html">Index HTML</a>
                <a href="?">Lobby</a>,
                <a href="?reload=10">Reload</a>
            </div>
        </nav>
    </header>

    <section id="entrance">
        <form>
            <input type="hidden" name="show_header" value="Y">
            <input type="hidden" name="show_header_menu" value="Y">
            <div class="caption">Please input username</div>
            <div class="username">
                <input name="username" placeholder="Input user name" size="10">
            </div>
            <div>
                <input type="submit" value="Enter Video Center">
            </div>
        </form>
    </section><!-- #entrance -->


    <section id="lobby">
        <h1>Lobby</h1>
        <nav class="lobby-menu">
            <button class="update-username" box="username">Update Username</button>

            <button class="logout">Logout</button>
            <button class="create-room" box="join-room">Create Room</button>
        </nav>
        <div class="lobby-menu-content">

            <div class="box username">
                <form>
                    <div class="caption">Username :</div>
                    <div class="text"><input name="username" placeholder="Input user name" size="10"></div>
                    <div class="button"><input type="submit" value="Update Username"></div>
                </form>
            </div>
            <div class="box join-room">
                <form>
                    <div class="caption">Input room name and submit the form to create a room.</div>
                    <input type="text" name="roomname" placeholder="Input room name to join">
                    <div class="button"><input type="submit" value="Join Chat Room"></div>
                </form>
            </div>

        </div>
        <div class="room-list">
            Room List
            <div class="content"></div>
        </div>
    </section>
    <section id="room" class="">
        <nav>
            <button class="leave">Leave</button>
            <button class="reconnect">Re-connect</button>
            Display :
            <button class="video-layout-list" onclick="videoLayout_list();">List</button>
            <button class="video-layout-Metro" onclick="videoLayout_metro();">Metro</button>
            <button class="video-layout-overlay" onclick="videoLayout_overlay();">Overlay</button>
            <button class="button-whiteboard" onclick="client.toggleWhiteboard();">WhiteBoard</button>
        </nav>
        <div class="content">
            <div class="videos">
            </div>
            <div class="chat">
                <form>
                    <div class="name"></div>
                    <div class="messages">You have entered a room</div>
                    <div class="input"><input type="text" name="message"></div>
                    <div class="users">
                        <div class="title">Users</div>
                        <div class="content"></div>
                    </div>
                </form>
            </div>
            <div class="document">
                <span class="books">Books</span> |
                <span class="" title="One folder up">Up</span> |
                <select name="books">
                    <option value="">Books</option>
                    <option value="Let's Go">Let's Go</option>
                    <option value="Side By Side">Side By Side</option>
                    <option value="Express Yourself">Express Yourself</option>
                    <option value="Speak Your Mind">Speak Your Mind</option>
                </select> |
                Upload<br>
                <div class="file-upload">
                    <form target="_hidden_file_upload_frame" enctype="multipart/form-data" action="<?php echo $url_server?>upload.php" method="POST">
                        <input type="hidden" name="MAX_FILE_SIZE" value="300000" />
                        Send this file: <input name="userfile" type="file" onchange="submit();" />
                        <input type="submit" value="Send File" style="width:0; height: 0; opacity: 0.01;"/>
                    </form>
                </div>

                <div class="document-content">

                </div>

            </div>
            <div class="whiteboard">
                <nav>
                    <button class="clear">Clear Whiteboard</button>
                    <button class="eraser">Eraser</button>
                    <button class="draw">Draw</button>
                    <label for="line-size">
                        <select id="line-size" name="line-size">
                            <option value="1">Extra Small</option>
                            <option value="2">Small</option>
                            <option value="3">Medium</option>
                            <option value="5">Large</option>
                            <option value="10">Extra Large</option>
                        </select>
                    </label>
                    <label for="color">
                        <select id="color" name="color">
                            <option value="black">Black</option>
                            <option value="red">Red</option>
                            <option value="blue">Blue</option>
                            <option value="green">Green</option>
                            <option value="white">White</option>
                        </select>
                    </label>
                </nav>
                <section class="markup">

                    <h2>
                        You are in Lobby
                    </h2>

                </section>
                <canvas id="whiteboard-canvas"></canvas>
            </div>
        </div>
    </section>

    <nav class="navbar navbar-fixed-bottom navbar-light bg-faded">
        <a class="navbar-brand" href="#">Fixed bottom</a>
    </nav>
    <footer>
        <div class="copyright narrow navbar navbar-fixed-bottom navbar-light bg-faded">
            Company Name: <%=company_name%>
        </div>
        <div class="copyright wide navbar navbar-fixed-bottom navbar-light bg-faded">
            Company Name: <%=company_name%> President : <%=ceo_name%><br>
            Phone: <%=phone_number%> Address: <%=address%><br>
            Copyright (C) 2013 ~ <%=Ymd%>
        </div>
    </footer>


</script>
<div id="videocenter" class="vc"></div>
<iframe name="_hidden_file_upload_frame" src="javascript:;" style="width: 0; height: 0; opacity: .01;"></iframe>

<script src="../js/jquery-2.2.3.min.js"></script>
<script src="../js/underscore-min.js"></script>
<script src="../js/underscore.string.min.js"></script>
<script src="../js/js.cookie.js"></script>
<script src="../dist/rmc3.js"></script>
<script src="../dist/rmc3.fbr.js"></script>
<script src="js/functions.js"></script>
<script src="js/rmc-wrapper.js"></script>
<script src="js/socket.js"></script>
<script src="js/element.js"></script>
<script src="js/whiteboard.js"></script>
<script src="js/entrance.js"></script>
<script src="js/lobby.js"></script>
<script src="js/room.js"></script>
<script src="js/chat.js"></script>
<script src="js/client.js"></script>
<script src="js/document.js"></script>
<script src="css/bootstrap/js/tether.min.js"></script>
<script src="css/bootstrap/js/bootstrap.min.js"></script>
</body>
</html>



