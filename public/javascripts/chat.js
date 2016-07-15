var socket = io();
$('document').ready(function () {
    $('form').submit(function () {
        alert('aaaaaaa')
        if ($('#m').val() != '') {
            var msg = {
                text: $('#m').val(),
                authorId: "<%= user._id %>"
            };
            socket.emit('chat message', msg);
            $('#m').val('');
        };
        return false;
    });

    socket.on('chat message', function(msg){
        $('#messages').append($('<li>').text(msg.text));
    });
});