JSE Table

[![Latest Stable Version](http://poser.pugx.org/eltharin/jsetable/v)](https://packagist.org/packages/eltharin/jsetable)
[![Total Downloads](http://poser.pugx.org/eltharin/jsetable/downloads)](https://packagist.org/packages/eltharin/jsetable)
[![Latest Unstable Version](http://poser.pugx.org/eltharin/jsetable/v/unstable)](https://packagist.org/packages/eltharin/jsetable)
[![License](http://poser.pugx.org/eltharin/jsetable/license)](https://packagist.org/packages/eltharin/jsetable)

JseTable is a JS script for making HTML tables with filtrable, sortable column and a pagination

Export is comming

creer table :

```
	let tableEnfant;

    document.addEventListener('DOMContentLoaded', function() {
        tableEnfant = new JSETable('.table');
    }, false);
```



inserer tableau Json :

```
tableEnfant.loadData({{ enfants|raw }});
```

inserer ligne Json :

```
tableEnfant.addLine(e.detail.data, true); //le true permet de rafraichir automatiquement le tableau
```




Doc : 

install : 

    document.addEventListener('DOMContentLoaded', function() {
        new JSETable('#table');
    }, false);
    
	
	document.addEventListener('DOMContentLoaded', function() {
		new JSETable('#table', {
			sort: [
				[1,"asc"]
			]
		});
	}, false);
		
	document.addEventListener('DOMContentLoaded', function() {
		new JSETable('table',{
			sessionSave: true
		});
	}, false);		
	
	
	
default opmtions


        "filterEnable": true,                     // enable/disable filters
        "sorterEnable": true,                     // enable/disable sort
        "pagerEnable": true,                      // enable/disable pager
        "exportEnable": false,                    // enable/disable export (next version)
        "debug": false,   						  // enable/disable debug
        "lignes" : null,                          // contain array of data
        "page_size" : null,                       // set default page size
        "classDivContainer": "JSEContainer",      // HTML Class for div container
        "classDivPager": "JSEPager",              // HTML Class for div pager
        "classDivPageSelect": "JSEPageSelect",    // HTML Class for div page select
        "classDivPageSize": "JSEPageSize",        // HTML Class for div page size
        "classDivExport": "JSEExport",            // HTML Class for div export
        "classDivTable": "JSETable",              // HTML Class for div table
        "classDivTop": "JSETop",                  // HTML Class for div top
        "classDivBottom": "JSEBottom",            // HTML Class for div bottom
        "classRowFilters": "JSEFilters",          // HTML Class for row with filters
        "classThSorters": "JSESorters",          // HTML Class for th for sort
        "pagerDivPosition": "top",                // Set Pager Select to Top / Bottom
        "pageSizeDivPosition": "top",             // Set Page Size Select to Top / Bottom
        "exportDivPosition": "top",               // Set Export Button to Top / Bottom

        "DivText": true,                  // Print the text
        "divTextFormat" : "{start} à {end} sur {filtered} lignes (total : {total})",
        "classDivText": "JSEText",  // HTML Class the text

        "pagerSelectPage": true,                  // Print the page selector
        "pagerSelectPageClass": "JSESelectPage",     // HTML Class the page selector
        "pagerSelectPageSize": true,
        "pagerSelectPageSizeClass": "JSESelectPageSize",
        "pagerSelectPageSizeList": [5,10,15,20,25,30,-1],
        "pagerSelectPageSizeAll": "Tous",

        "pagerBtnFirstLast": true,
        "pagerBtnClass": "JSEBtn",

        "pagerBtnFirstVal": "<<",
        "pagerBtnPrevVal":  "<",
        "pagerBtnNextVal":  ">",
        "pagerBtnLastVal":  ">>",

        "filterMultiple" : true,
        "sessionSave" : false,



actions
	
	
	
	
	
	
	
	
	
    static setDefaultOption(optionName, optionValue)
    static addGlobalRenderer(type, renderer)
	
    addRenderer(type, renderer)
    render()
    sort(e)
    filter(colNum, filter, render=true)
    fillFilters(colNum = null)
    addLine(line)
    removeLine(numLine)
    updateLine(numLine, data)
    setValue(numLine, colName, value)
    updateLineValues(numLine)
    loadData(data)
    trigger(eventName)
    addEventListner(eventName, listnerName, callback, priority = 50)
    debug(str)
    createSelect()
    getNbPages()
    setPageSize(size, render=true)
    pageSet(page)
    pageFirst()
    pageDown()
    pageUp()
    pageLast()
    reloadHtml()
	
- FormType
