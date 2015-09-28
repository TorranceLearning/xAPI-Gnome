
//		for (var key in jsonType) {
//			if (jsonType.hasOwnProperty(key) && (itemType===key) ) {
//				tincan.sendStatement({
//					actor: {name: username, mbox: email},
//					verb: {	
//						id: verbIDprefix + jsonType[key].verb, 
//						display: { und: jsonType[key].display }
//					},
//					target: {
//						id: objectIDprefix + jsonType[key].objectID,
//						definition: {
//							name: {und: jsonType[key].definition},
//							description: {und: jsonType[key].description},
//						}					
//					}
//				});
//			}
//		}

jsonType = {
  "manual": {
    "verb": "completed",
    "display": "completed",
    "objectID": "hr/id-badge",
    "definition": "getting a photo ID badge",
    "description": "A manual checklist item to confirm completion of a disconnected action."
  },
  "url": {
    "verb": "viewed",
    "display": "viewed",
    "objectID": "website/alaskan-fish",
    "definition": "",
    "description": "Website about Alaskan fish species."
  },
  "question": {
    "verb": "answered",
    "display": "answered",
    "objectID": "questions/alaskan-salmon-species",
    "definition": "",
    "description": "How many species of Salmon are found in Alaska?"
  },
  "freeform": {
    "verb": "commented",
    "display": "commented",
    "objectID": "observations/freeform",
    "definition": "",
    "description": "Thoughts and takeaways regarding: "
  },
  "beacon": {
    "verb": "completed",
    "display": "completed",
    "objectID": "activities/iot/tour/warehouse",
    "definition": "Warehouse Tour",
    "description": "A beacon-based tour of the warehouse."
  },
  "course": {
    "verb": "completed",
    "display": "completed",
    "objectID": "",
    "definition": "'What do you Gnome' course",
    "description": "'What do you Gnome' course in the Fresh Fish learning portal."
  },
  "nfc": {
    "verb": "attended",
    "display": "attended",
    "objectID": "people/meetings/conversation",
    "definition": "a meeting with ",
    "description": "Conversation with a manager about how the first week at Fresh Fish has been going."
  },
  "video": {
    "verb": "watched",
    "display": "watched",
    "objectID": "",
    "definition": "Fish Swimming",
    "description": "A video of fish swimming."
  },
  "qr": {
    "verb": "found",
    "display": "found",
    "objectID": "locations/personal/locker",
    "definition": "the locker",
    "description": "Employee's personal storage locker."
  }
}