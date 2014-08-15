define(['models/Status'], function (Status) {
    //TODO: wrap up in a return function
    var StatusCollection = Backbone.Collection.extend({
        model: Status
    });

    return StatusCollection;
});
