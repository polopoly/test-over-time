var polopoly = polopoly || {}

polopoly.TicketsWidget = AjaxSolr.AbstractWidget.extend({
    afterRequest: function() {
	this.clear()
        var that = this
        $.each(this.manager.response.response.docs, function(ind, doc) {
	    that.add(doc)
        })
    },
    clear: function() {
	$(this.target).empty()
    },
    add: function(doc) {
	$(this.target).append(AjaxSolr.theme('pp_ticket', doc))
    }
})
AjaxSolr.theme.prototype.pp_ticket = function(doc) {
    var track = 'http://prodtest01/trac/search'
    track = track + '?wiki=on&changeset=on&ticket=on&q='
    track = track + doc.ticket_s.replace('#', '%23')
    var output = '<div>' ;
    output = output + '<a target="_blank" href="'+track+'" class="ticket">'+doc.ticket_s+'</a> '
    output = output + '<span class="comment">'+doc.comment_s+'</span> '
    output = output + '<a href="#" class="remove" data-docid="'+doc.id+'">remove</a> '
    output = output + '</div>'
    return output
}
AjaxSolr.theme.prototype.pp_ticket_doc = function(doc) {
    var output = '<doc>'
    output = output + '<field name="id">' + doc.id + '</field>'
    output = output + '<field name="test">' + doc.test + '</field>'
    output = output + '<field name="ticket_s">' + doc.ticket_s + '</field>'
    output = output + '<field name="comment_s">' + doc.comment_s + '</field>'
    output = output + '</doc>'
    return output
}
AjaxSolr.theme.prototype.pp_ticket_input = function() {
    var output = '<div>'
    output = output + AjaxSolr.theme('pp_ticket_input_field', 'Ticket')
    output = output + AjaxSolr.theme('pp_ticket_input_field', 'Comment')
    output = output + '<p><input id="tickets_comment" type="button" value="save"></input></p>'
    output = output + '</div>'
    return output
}
AjaxSolr.theme.prototype.pp_ticket_input_field = function(field) {
    var output = '<p>'
    output = output + '<input id="tickets-' + field + '"></input> ' + field
    output = output + '</p>'
    return output
}