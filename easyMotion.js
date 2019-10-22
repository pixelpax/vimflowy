
let EasyMotionMap = new Map();
let EasyMotionElementsAdded = false;
const EasyMotionTags = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890+!"#¤%&/()=?';
const EasyMotionTextFillColor = '#D33682'; 

function InitEasyMotionMap()
{
    var easyMotionTagsCopy = EasyMotionTags.split("");
    const kids = WF.currentItem().getVisibleChildren();
    for (var i = 0; i < kids.length; ++i) 
    {
      addItemToEasyMotionMap(kids[i], easyMotionTagsCopy);
    }
}

function HandleEasyMotion_KeyUp()
{
	if(EasyMotionMap.size == 0)
		return;

	if(EasyMotionElementsAdded)
		return;

	AddEasyMotionElements();
	EasyMotionElementsAdded = true;
}

function HandleEasyMotion_KeyDown(event)
{
    if(EasyMotionMap.size == 0) 
		return false;

	// Ignore shift, ctrl, etc.
	if(event.key == "Shift" || event.key == "Control" || event.key == "Alt" || event.key == "Meta")
		return false;

	const easyMotionItem = EasyMotionMap.get(keyFrom(event)); 
	if(easyMotionItem)
	{
		WF.editItemName(easyMotionItem);
		setCursorAt(state.get().anchorOffset);
	}

	EasyMotionElementsAdded = false;
	RemoveEasyMotionElements();
	EasyMotionMap.clear();

	return true;
}

function addItemToEasyMotionMap(item, easyMotionTagsCopy)
{
    if(easyMotionTagsCopy.length <= 0)
      return;

    if(IsInViewport(item) && item.equals(WF.focusedItem()) == false)
    	EasyMotionMap.set(easyMotionTagsCopy.shift(), item); 

    if(!item.isExpanded())
      return;

    var kids = item.getVisibleChildren();
    if (kids !== undefined && kids.length != 0) 
    {
      for (var i = 0; i < kids.length; ++i) 
      {
        addItemToEasyMotionMap(kids[i], easyMotionTagsCopy);
      }
    }
}

function AddEasyMotionElements()
{
	RemoveEasyMotionElements();
	for (const [tag, item] of EasyMotionMap) 
		AddEasyMotionElement(tag, item);
}

function AddEasyMotionElement(tag, item)
{
    var bullet = item.getElement().getElementsByTagName('svg')[0]; 

    var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttributeNS(null, 'cx', '50%');
    circle.setAttributeNS(null, 'cy', '50%');
    circle.setAttributeNS(null, 'r', '50%');
    circle.setAttributeNS(null, 'id', 'EasyMotionCircle');
    var bodyBackgroundColor = window.getComputedStyle(document.body, null).getPropertyValue('background-color'); 
    circle.setAttributeNS(null, 'fill', bodyBackgroundColor);
    circle.setAttributeNS(null, 'stroke', bodyBackgroundColor);
    circle.setAttributeNS(null, 'stroke-width', '10px');
    bullet.appendChild(circle);

    var element = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    // element.setAttributeNS(null, 'fill', '#D33682');
    element.setAttributeNS(null, 'fill', EasyMotionTextFillColor);
    element.setAttributeNS(null, 'alignment-baseline', 'central');
    element.setAttributeNS(null, 'text-anchor', 'middle');
    element.setAttributeNS(null, 'x', '50%');
    element.setAttributeNS(null, 'y', '50%');
    element.setAttributeNS(null, 'font-size', '100%');
    element.setAttributeNS(null, 'font-weight', 'bold');
    element.setAttributeNS(null, 'stroke-linecap', 'round');
    element.setAttributeNS(null, 'id', 'EasyMotionText');
    // var bodyColor = window.getComputedStyle( document.body ,null).getPropertyValue('color'); 
    // element.setAttributeNS(null, 'fill', bodyColor);
    var txt = document.createTextNode(tag);
    element.appendChild(txt);

    bullet.appendChild(element);
}

function RemoveEasyMotionElements()
{
	for (var item of EasyMotionMap.values())
	{
		RemoveEasyMotionElement(item);
	}
}

function RemoveEasyMotionElement(item)
{
    var bullet = item.getElement().getElementsByTagName('svg')[0]; 

    var easyMotionCircle = bullet.getElementById('EasyMotionCircle'); 
	if(easyMotionCircle)
		bullet.removeChild(easyMotionCircle);

    var easyMotionText = bullet.getElementById('EasyMotionText'); 
	if(easyMotionText)
		bullet.removeChild(easyMotionText);
}

function IsInViewport(item)
{
	if(!item)
		return false;

	const itemElement = item.getElement();
	if(!itemElement)
		return false;
	  
  	const rect = itemElement.getBoundingClientRect();
	return rect.top >= 0 && rect.top <= window.innerHeight;
}

