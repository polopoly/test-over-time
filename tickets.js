var tickets = (function(){
    var solr_url = null
    function ajax_error(jqXHR, error, errorThrown) { 
	if (console && console.log) {
	    console.log('Failed: ' + error)
	    console.log(errorThrown)
	    console.log(jqXHR)
	}
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
	var pager = new AjaxSolr.PagerWidget({
	    id: args.target + 'pager',
	    target: args.target + 'pager',
	    prevLabel: '&lt;',
	    nextLabel: '&gt;',
	    innerWindow: 1,
	    renderHeader: function (perPage, offset, total) {
		$(this.target + 'header').html($('<span/>').text('Comments ' + Math.min(total, offset + 1) + ' to ' + Math.min(total, offset + perPage) + ' of ' + total));
	    }
	})
	manager.addWidget(pager)
	return {
	    load: function() {
		manager.store.remove('q')
		var q = 'test:'+escape_test_name(args.test())
		manager.store.addByValue('q', 'ticket:#* AND ' + q)
                var defaultFieldList = [
                    'branch',
                    'datestamp',
                    'id',
                    'platform',
                    'suite',
                    'test',
                    'ticket',
                    'status'
                    ];
                manager.store.addByValue('fl', defaultFieldList.join(' OR '));
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
		 dataType: 'text',
		 error: ajax_error }
    }
    // Errors returned for no reason? data is stored... most of the time
    function ignore_empty_errors(args) {
	return function(jqXHR, error, errorThrown) {
	    if (error == 'error' && errorThrown === undefined) {
		var that = this
		if (args.context) {
		    that = args.context
		}
		args.success.call(that, '<bogus></bogus>', 'bogus ok', jqXHR)
	    } else {
		ajax_error(jqXHR, error, errorThrown)
	    }
	}
    }
    function save_comment(args) {
	var doc = { id: generate_id(args),
		    test: escape_test_name(args.test),
		    ticket: args.ticket,
		    comment: args.comment }
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
	var req = {}
	$.extend(req, options(), args, {
	    data: data,
	    error: ignore_empty_errors(args)
	})
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
	$('#tickets-Ticket').val('#')
	$('#tickets-Comment').val('')
	ticketsdialog.dialog('open')
    }
    function remove_comment(args) {
	var data = '<delete><id>'+args.id+'</id></delete>'
	var req = {}
	$.extend(req, options(), args, {
	    data: data,
	    error: ignore_empty_errors(args)
	})
	$.ajax(req)
    }
    return {
	init: init,
	create: create_widget,
	save: take_comment,
	remove: remove_comment
    }
})()
