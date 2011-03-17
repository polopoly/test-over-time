var tickets = (function(){
    var solr_url = null
    function ajax_error(jqXHR, error, errorThrown) { 
	if (console && console.log) { console.log(errorThrown) }
	alert('Failed: ' + error)
    }
    function init(solr) {
	solr_url = solr
    }
    function escape_test_name(test_name) {
	return test_name.replace(':', '/')
    }
    function create_widget(args) {
	var manager = new AjaxSolr.Manager({
	    solrUrl: solr_url
	})
	manager.init()
	var tickets = new polopoly.TicketsWidget({
	    id: args.target,
	    target: args.target
	})
	manager.addWidget(tickets)
	return {
	    load: function() {
		manager.store.remove('q')
		var q = 'test:'+escape_test_name(args.test())
		manager.store.addByValue('q', q)
		manager.store.addByValue('q', 'ticket_s:#*')
		manager.doRequest()
	    },
	    add: function(doc) {
		tickets.add(doc)
	    }
	}
    }
    function date() {
        function padd(v) { 
            var s = '' + v
            return s.length == 1 ? '0' + s : s ;
        }
        var date = new Date()
        return date.getUTCFullYear() + '-' +
	    padd(date.getUTCMonth()) + '-' +
	    padd(date.getUTCDate()) + 'T' +
            padd(date.getUTCHours()) + ':' +
	    padd(date.getUTCMinutes()) + ':' +
	    padd(date.getUTCSeconds()) + 'Z'
    }
    function generate_id(args) {
        return date() + '-' + args.ticket + '-' + args.test
    }
    function options() {
	return { url: solr_url + 'update?commit=true',
		 type: 'POST',
		 contentType: 'text/xml',
		 dataType: 'XML',
		 error: ajax_error }
    }
    function save_comment(args) {
	var doc = { id: generate_id(args),
		    test: escape_test_name(args.test),
		    ticket_s: args.ticket,
		    comment_s: args.comment }
	if (args.success) {
	    var original_success = args.success
	    args.success = function (data, textStatus, jqXHR) {
		original_success.call(this,
				      { data: data, doc: doc },
				      textStatus,
				      jqXHR)
	    }
	}
        var data = '<add>' + AjaxSolr.theme('pp_ticket_doc', doc) + '</add>'
	var req = { data: data }
	$.extend(req, args, options())
	$.ajax(req)
    }
    var ticketsdialog = null
    var ticketsargs = null
    function take_comment(args) {
	ticketsargs = args
	if (!ticketsdialog) {
	    ticketsdialog = $(AjaxSolr.theme('pp_ticket_input')).dialog({
		autoOpen: false,
		title: 'Add ticket to Test',
		modal: true
	    })
	    $('#tickets_comment').live('click', function() {
		var last_args = ticketsargs
		ticketsargs = null
		ticketsdialog.dialog('close')
		$.extend(last_args, {
		    ticket: $('#tickets-Ticket').val(),
		    comment: $('#tickets-Comment').val()
		})
		save_comment(last_args)
	    })
	}
	ticketsdialog.dialog('open')
    }
    function remove_comment(args) {
	var req = { data: '<delete><id>'+args.id+'</id></delete>' }
	$.extend(req, args, options())
	$.ajax(req)
    }
    return {
	init: init,
	create: create_widget,
	save: take_comment,
	remove: remove_comment
    }
})()
