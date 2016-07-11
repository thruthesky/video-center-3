<?php
/**
 *
 * @see README.md
 *
 * @see # HOW TO RUN to run nginx + php-fpm
 *
 */

$runPlace = 'call-center-desktop';
$urlSocketServer = 'https://www.onfis.com:10443'; // TEST Server
$urlSocketServer = 'https://www.videocenter.co.kr:10443'; // should be real server on production. could be a local server on development.
?>
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
    <link href="css/custom-select.css" rel="stylesheet">
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
    </style>
    <script>


        //
        var debugMode = 'call-center-desktop';


        //var bookServerURL = "https://www.onfis.com:30443/book9/";
        var bookServerURL = "https://www.videocenter.co.kr/book9/";

        var socketURL = '<?php echo $urlSocketServer?>'; // socket server. it is used on rmc-wrapper.js

        var bookURL = bookServerURL + 'dir.php';


        var video_count = 0; // @todo remove this if not in use.
    </script>
</head>
<body>
<script type="text/template" id="template">

    <header>
        <div class="caption">
            <span class="logo">LOGO</span>
        </div>
        <nav class="header-menu">
            <div>
                <?php /* Add some menu here if you want */ ?>
            </div>
        </nav>
    </header><!-- #header -->

    <section id="entrance">
        <div>
            <div class="row">
                <div class="col-sm-6 left">
                    <form>
                        <input type="hidden" name="show_header" value="Y">
                        <input type="hidden" name="show_header_menu" value="Y">
                        <div class="username">
                            <input name="username" placeholder="Input Username" size="10">
                        </div>
                        <div>
                            <input type="submit" class="btn btn-primary" value="ENTER VIDEO CENTER">
                        </div>
                    </form>
                </div>
                <div class="col-sm-6 right">
                    <div class="title">Video Center Guidelines</div>
                    <div class="desc">
                        <div>-Vivamus bibendum elit non mollis egestas.</div>
                        <div>-Nam molestie, purus a malesuada</div>
                        <div>-hendrerit, nulla odio congue magna, at</div>
                        <div>-volutpat justo urna vel velit. Duis nunc</div>
                        <div>-velit, commodo at risus nec, commodo</div>
                        <div>-tincidunt diam. Nulla quis felis justo. Etiam</div>
                        <div>-eleifend gravida orci, nec faucibus mauris</div>
                        <div>-eget. Sed laoreet augue erat, vel volutpat</div>
                        <div>-massa euismod et. Fusce eu sapien iaculis, s</div>
                        <div>-celerisque tortor et, fermentum quam.</div>
                    </div>
                </div>
            </div>
        </div>
    </section><!-- #entrance -->


    <section id="lobby">
        <div>
            <div class="lobby-header">
                <h1>Lobby</h1>
                <nav class="lobby-menu">
                    <button class="update-username" box="username">Update Username</button>
                    <button class="create-room" box="join-room">Create Room</button>
                    <button class="logout">Logout</button>
                </nav>

                <div class="lobby-menu-content">
                    <div class="box username">
                        <form>
                            <input name="username" placeholder="Input user name" size="10">
                            <input type="submit" value="Update">
                        </form>
                    </div>
                    <div class="box join-room">
                        <form>
                            <input type="text" name="roomname" placeholder="Input room name to join">
                            <input type="submit" value="Join Chat Room">
                        </form>
                    </div>
                </div>

                <div class="room-list">
                    Room List
                    <div class="content"></div>
                </div>
            </div>
        </div>
    </section><!-- #lobby -->
    
    
    <section id="room" class="">
        <nav>
            <button class="video-layout-list left" onclick="videoLayout_list();"><i class="fa fa-list" aria-hidden="true"></i> <span>List</span></button>
            <button class="video-layout-Metro left" onclick="videoLayout_metro();"><i class="fa fa-cubes" aria-hidden="true"></i> <span>Metro</span></button>
            <button class="video-layout-overlay left" onclick="videoLayout_overlay();"><i class="fa fa-object-ungroup" aria-hidden="true"></i> <span>Overlay</span></button>
            <button class="button-whiteboard left show" onclick="whiteboard.toggle();"><i class="fa fa-television" aria-hidden="true"></i> <span>WhiteBoard</span></button>
            <button class="room-leave left"><i class="fa fa-users" aria-hidden="true"></i> <span>Lobby</span></button>
            <button class="room-reconnect left"><i class="fa fa-refresh" aria-hidden="true"></i> <span>Reload</span></button>
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
                <span class="books">Books</span>
                <div class="container">
                    <select name="books" class="btn">
                        <option value="">Books</option>
                        <option value="Let's Go">Let's Go</option>
                        <option value="Side By Side">Side By Side</option>
                        <option value="Express Yourself">Express Yourself</option>
                        <option value="Speak Your Mind">Speak Your Mind</option>
                    </select>

                    <a class="btn folder_up">
                        <i class="fa fa-level-up" title="One folder up" aria-hidden="true"></i>
                        <span class="sr-only">One folder up</span>
                    </a>
                    <div class="file-upload">
                        <form target="_hidden_file_upload_frame" enctype="multipart/form-data" action="<?php echo $url_server?>upload.php" method="POST">
                            <input type="hidden" name="MAX_FILE_SIZE" value="300000" />
                            <input name="userfile" type="file" onchange="submit();" />
                        </form>
                    </div>
                </div>
                    <div class="document-content">

                    </div>

            </div>
            <div class="whiteboard">
                <nav>
                    <button class="clear btn btn-primary btn-sm"><i class="fa fa-file-o" aria-hidden="true"></i> <span>Clear Whiteboard</span></button>
                    <button class="eraser btn btn-primary btn-sm"><i class="fa fa-eraser" aria-hidden="true"></i> <span>Eraser</span></button>
                    <button class="draw btn btn-primary btn-sm"><i class="fa fa-pencil" aria-hidden="true"></i> <span>Draw</span></button>
                    <div class="line-size">
                        <div class="select">
                            <i class="fa fa-caret-down" aria-hidden="true"></i>
                            <div value="1" class="extra-small option btn-sm active"><hr><span>Extra Small</span></div>
                            <div value="2" class="small option btn-sm"><hr><span>Small</span></div>
                            <div value="3" class="medium option btn-sm"><hr><span>Medium</span></div>
                            <div value="5" class="large option btn-sm"><hr><span>Large</span></div>
                            <div value="10" class="extra-large option btn-sm"><hr><span>Extra Large</span></div>
                        </div>
                    </div>
                    <div class="colors">
                        <div class="select">
                            <i class="fa fa-caret-down" aria-hidden="true"></i>
                            <div value="black" class="black option btn-sm active"><i class="fa fa-square" aria-hidden="true"></i> <span>Black</span></div>
                            <div value="red" class="red option btn-sm"><i class="fa fa-square" aria-hidden="true"></i> <span>Red</span></div>
                            <div value="blue" class="blue option btn-sm"><i class="fa fa-square" aria-hidden="true"></i> <span>Blue</span></div>
                            <div value="green" class="green option btn-sm"><i class="fa fa-square" aria-hidden="true"></i> <span>Green</span></div>
                            <div value="white" class="white option btn-sm"><i class="fa fa-square" aria-hidden="true"></i> <span>White</span></div>
                        </div>
                    </div>
                </nav>
                <section class="markup">

                </section>
                <canvas id="whiteboard-canvas"></canvas>
            </div>
        </div>
    </section><!-- #room -->
    
    <footer>
        <div class="copyright">
            Company Name: <%=company_name%>
        </div>
        <div class="copyright">
            Company Name: <%=company_name%> President : <%=ceo_name%><br>
            Phone: <%=phone_number%> Address: <%=address%><br>
            Copyright (C) 2013 ~ <%=Ymd%>
        </div>
    </footer><!-- #footer -->


</script>
<div id="videocenter" class="vc"></div>
<iframe name="_hidden_file_upload_frame" src="javascript:;" style="display:none; width: 0; height: 0; opacity: .01;"></iframe>


<script src="<?php echo $urlSocketServer?>/socket.io/socket.io.js"></script>
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
<script src="js/custom-select.js"></script>
<script src="css/bootstrap/js/tether.min.js"></script>
<script src="css/bootstrap/js/bootstrap.min.js"></script>
</body>
</html>



