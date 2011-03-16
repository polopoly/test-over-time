var tickets = (function(){
    var solr_url = null
    function ajax_error(jqXHR, error, errorThrown) { 
	if (console && console.log) { console.log(errorThrown) }
	alert('Failed: ' + error)
    }
    function init(solr) {
	solr_url = solr
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
		manager.store.addByValue('q', 'test:'+args.test())
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
	var id = generate_id(args)
	var doc = { id: id,
		    test: args.test,
		    ticket_s: args.ticket,
		    comment_s: args.comment }
	if (args.success) {
	    var original_success = args.success
	    args.success = function (data, textStatus, jqXHR) {
		original_success({ data: data, doc: doc }, textStatus, jqXHR)
	    }
	}
        var data = '<add>' + AjaxSolr.theme('pp_ticket_doc', doc) + '</add>'
	var req = { data: data }
	$.extend(req, args, options())
	$.ajax(req)
    }
    function remove_comment(args) {
	var req = { data: '<delete><id>'+args.id+'</id></delete>' }
	$.extend(req, args, options())
	$.ajax(req)
    }
    return {
	init: init,
	create: create_widget,
	save: save_comment,
	remove: remove_comment
    }
})()
