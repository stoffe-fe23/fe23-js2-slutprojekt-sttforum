/*
    Slutprojekt Javascript 2 (FE23 Grit Academy)
    Grupp : STTForum

    htmlUtilities.ts
    Generic tool/utility functionality for building/editing HTML elements. 
*/

//////////////////////////////////////////////////////////////////////////////////////////////////////
// Create HTML elements based on a HTML template, inserting values into the new element.
// * templateId is the ID of the <template> tag in the HTML file to use.
// * container is the HTMLElement to insert the new html element into. If not set the new element is still returned. 
// * values is an object of key/value pairs where the KEY is the value of the "data-template" attribute on the target tag,
//   and VALUE is the new text content of the matching tag(s). Special cases for certain tag types:
//   - IMG: Value is set into the SRC attribute.
//   - A: Value is set into the HREF attribute.
//   - Form elements: Value is set into the VALUE attribute. 
export function createHTMLFromTemplate(templateId: string, container: HTMLElement | null = null, values: Record<string, string | number | boolean> = {}, attributes: Record<string, string> | null = null, allowHTML: boolean = false): HTMLElement {
    let newElement: HTMLElement;
    const template = document.getElementById(templateId) as HTMLTemplateElement;

    if (template) {
        newElement = template.content.firstElementChild!.cloneNode(true) as HTMLElement;
        newElement.removeAttribute("data-template");

        for (const key in values) {
            const targetElements = newElement.querySelectorAll(`[data-template="${key}"]`);
            targetElements.forEach((targetElement) => {
                if (targetElement) {
                    targetElement.removeAttribute("data-template");
                    switch (targetElement.tagName) {
                        case "IMG": (targetElement as HTMLImageElement).src = values[key] as string; break;
                        case "A": (targetElement as HTMLAnchorElement).href = values[key] as string; break;
                        case "TEXTAREA":
                        case "SELECT":
                        case "INPUT":
                            if ((targetElement as HTMLInputElement).type == "checkbox") {
                                (targetElement as HTMLInputElement).checked = values[key] as boolean;
                            }
                            else {
                                (targetElement as HTMLInputElement).value = values[key] as string;
                            }
                            break;
                        default:
                            if (allowHTML) {
                                (targetElement as HTMLElement).innerHTML = values[key] as string;
                            }
                            else {
                                (targetElement as HTMLElement).innerText = values[key] as string;
                            }
                            break;
                    }
                }
            });
        }

        if (attributes) {
            for (const key in attributes) {
                if (newElement.getAttribute(key)) {
                    newElement.setAttribute(key, attributes[key]);
                }
                const childAttributes = newElement.querySelectorAll(`[${key}]`);
                childAttributes.forEach((attr) => {
                    attr.setAttribute(key, attributes[key]);
                });
            }
        }

        if (container) {
            container.appendChild(newElement);
        }
    }
    else {
        newElement = createHTMLElement("div", `Template not found: ${templateId}`, container, 'error');
    }

    return newElement;
}


//////////////////////////////////////////////////////////////////////////////////////////////////////
// Create a HTML element and attach it to the specified parent and return it. 
// Special cases for certain elementTypes:
// * UL/OL/SELECT/DATALIST: elementText is an array of strings holding the list options (for SELECT the strings are optionally formated as: "value|text label|optgroup name")
// * IMG: elementText is set as the ALT attribute of the image. Use the elementAttributes parameter to set the SRC. 
// * INPUT: elementText becomes the label of the element. A wrapper is created around the input and label. 
export function createHTMLElement(elementType: string, elementText: string | string[], parentElement: HTMLElement | null = null, elementClass: string | string[] = '', elementAttributes: Record<string, string> | null = null, allowHTML: boolean = false): HTMLElement {
    let newElement: HTMLElement = document.createElement(elementType);
    elementType = elementType.toLowerCase();

    addAttributesToElement(newElement, elementAttributes);
    addClassToElement(newElement, elementClass);

    // List type elements
    if (elementText && elementText.length && Array.isArray(elementText)) {
        if ((elementType == 'ul') || (elementType == 'ol')) {
            buildListOptions(newElement, elementText, allowHTML);
        }
        else if ((elementType == 'select') || (elementType == 'datalist')) {
            buildSelectOptions(newElement, elementText);
        }
        else {
            newElement[allowHTML ? "innerHTML" : "innerText"] = elementText[0];
        }
    }
    else if (elementText && elementText.length) {
        if (elementType == 'img') {
            (newElement as HTMLImageElement).alt = elementText as string;
        }
        // Add wrapper and label to input fields
        else if ((elementType == 'input') && (elementText.length > 0)) {
            buildInputField(newElement, elementText as string, elementClass, allowHTML);
        }
        else {
            newElement[allowHTML ? "innerHTML" : "innerText"] = elementText as string;
        }
    }

    if (parentElement) {
        parentElement.appendChild(newElement);
    }
    return newElement;
}


//////////////////////////////////////////////////////////////////////////////////////////////////////
// Add CSS class(es) to a DOM element
function addClassToElement(targetElement: HTMLElement, classesToAdd: string | string[]): void {
    if ((targetElement !== undefined) && (targetElement !== null)) {
        if (classesToAdd.length > 0) {
            if (Array.isArray(classesToAdd)) {
                targetElement.classList.add(...classesToAdd);
            }
            else if (classesToAdd && classesToAdd.length) {
                targetElement.classList.add(classesToAdd);
            }
        }
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////
// Apply list of tag attributes to the target HTML element.
function addAttributesToElement(targetElement: HTMLElement, elementAttributes: Record<string, string> | null = null): void {
    if (elementAttributes && (typeof elementAttributes == "object") && Object.keys(elementAttributes).length) {
        for (const attributeName in elementAttributes) {
            targetElement.setAttribute(attributeName, elementAttributes[attributeName]);
        }
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////
// Build options for select/datalist element.
function buildSelectOptions(targetElement: HTMLElement, elementText: string[]) {
    for (const optionItemText of elementText) {
        const [optValue, optLabel, optGroup]: string[] = optionItemText.split('|');
        const newOptionItem = document.createElement("option") as HTMLOptionElement;

        newOptionItem.innerText = (optLabel ?? optValue);
        newOptionItem.value = optValue;

        if (optGroup) {
            let optionGroup: HTMLOptGroupElement | null = targetElement.querySelector(`optgroup[label="${optGroup}"]`);
            if (!optionGroup) {
                optionGroup = document.createElement("optgroup") as HTMLOptGroupElement;
                optionGroup.label = optGroup;
                targetElement.appendChild(optionGroup);
            }
            optionGroup.appendChild(newOptionItem);
        }
        else {
            targetElement.appendChild(newOptionItem);
        }
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////
// Build options for ordered/unordered lists.
function buildListOptions(targetElement: HTMLElement, elementText: string[], allowHTML: boolean = false) {
    for (const listItemText of elementText) {
        const newListItem = document.createElement("li");
        newListItem[allowHTML ? "innerHTML" : "innerText"] = listItemText;
        targetElement.appendChild(newListItem);
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////
// Create wrapper and label for input fields.
function buildInputField(targetElement: HTMLElement, elementText: string, elementClass: string | string[] = '', allowHTML: boolean) {
    const actualtargetElement = targetElement;
    const targetElementLabel = document.createElement("label");
    targetElement = document.createElement("div");
    targetElement.id = `${actualtargetElement.id}-wrapper`;
    if (elementClass.length > 0) {
        targetElement.classList.add((Array.isArray(elementClass) ? elementClass[0] : elementClass) + "-wrapper");
    }

    targetElementLabel.setAttribute("for", actualtargetElement.id);
    targetElementLabel[allowHTML ? "innerHTML" : "innerText"] = elementText;

    if ((actualtargetElement.getAttribute("type") == "radio") || (actualtargetElement.getAttribute("type") == "checkbox")) {
        targetElementLabel.classList.add(`input-box-label`);
        targetElement.append(actualtargetElement, targetElementLabel);
    }
    else {
        targetElement.append(targetElementLabel, actualtargetElement);
    }
}


//////////////////////////////////////////////////////////////////////////////////////////////////////
// Convert a timestamp to a displayable date string (YYYY-MM-DD HH:II:SS)
export function dateTimeToString(time: Date | number, locale: string = 'sv-SE'): string {
    const dateObj = (time instanceof Date) ? time : new Date(time);
    const formatOptions: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric"
    };

    return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj);
}


//////////////////////////////////////////////////////////////////////////////////////////////////////
// Return a string cropped down to a maximum number of characters. The function will cut off the
// string at the closest space character before the max-length to avoid cutting in the middle of words.
export function getTruncatedString(truncText: string, maxLength: number): string {
    if (maxLength < truncText.length) {
        let cutOffLength = truncText.lastIndexOf(" ", maxLength);
        if (cutOffLength < 1) {
            cutOffLength = maxLength;
        }
        truncText = truncText.slice(0, cutOffLength) + "…";
    }
    return truncText;
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Wrap the selected text in the specified text area in the specified HTML tag type (without <> or attributes)
export function wrapSelectedTextAreaString(textArea: HTMLTextAreaElement, htmlTag: string): void {
    const startIdx = textArea.selectionStart;
    const endIdx = textArea.selectionEnd;
    if (startIdx != endIdx) {
        const textContent = textArea.value;
        const selText = textContent.substring(startIdx, endIdx);
        textArea.value = textContent.substring(0, startIdx) + `<${htmlTag}>${selText}</${htmlTag}>` + textContent.substring(endIdx, textContent.length);
    }
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Function providing the HTML DOM element for editor formatting buttons for the specified textarea. 
export function buildEditorFormatButtons(editorTextArea: HTMLTextAreaElement): HTMLElement {
    const buttons = createHTMLFromTemplate("tpl-formatting-buttons");
    buttons.addEventListener("click", (event) => {
        if ((event.target as HTMLElement).tagName == "BUTTON") {
            switch ((event.target as HTMLButtonElement).value) {
                case "bold": wrapSelectedTextAreaString(editorTextArea, "b"); break;
                case "italic": wrapSelectedTextAreaString(editorTextArea, "i"); break;
                case "underline": wrapSelectedTextAreaString(editorTextArea, "u"); break;
            }
        }
    });

    return buttons;
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Set the content of an element to a string that may only contain whitelisted HTML elements
// contentString = string with the content to assign to the element
// contentElement = the HTML element to assign the content to
// allowedTags = array with the names of tags that are allowed to be used in the content (i.e. ['strong', 'em'])
// allowedAttributes = array with the names of attributes that may be used on allowed tags in the content
export function setContentWithTagFilter(contentString: string, contentElement: HTMLElement, allowedTags: string[] | null = null, allowedAttributes: string[] | null = null): HTMLElement {
    const tempElement = document.createElement("template");
    tempElement.innerHTML = contentString;

    if ((contentElement === undefined) || (contentElement === null)) {
        contentElement = document.createElement("div");
    }

    if ((allowedTags === undefined) || (allowedTags === null) || (allowedTags.length < 1)) {
        allowedTags = ['b', 'i', 'a', 'blockquote'];
    }
    if ((allowedAttributes === undefined) || (allowedAttributes === null) || (allowedAttributes.length < 1)) {
        allowedAttributes = ['href'];
    }

    allowedTags = allowedTags.map((elem) => elem.toUpperCase());
    allowedAttributes = allowedAttributes.map((elem) => elem.toLowerCase());

    copyContentWithFilteredTags(tempElement.content, contentElement, allowedTags, allowedAttributes);
    return contentElement;
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Helper function for setContentWithFilteredTags(), step through the baseElement and copy allowed child elements
// to the target element and add the rest as text. 
function copyContentWithFilteredTags(baseElement: HTMLElement | DocumentFragment, copyElement: HTMLElement, allowedTags: string[], allowedAttributes: string[]): void {
    if (baseElement.childNodes.length > 0) {
        baseElement.childNodes.forEach((checkChild) => {
            if (checkChild.nodeType == Node.ELEMENT_NODE) {
                let currElement: HTMLElement;
                if (allowedTags.includes((checkChild as HTMLElement).tagName)) {
                    currElement = document.createElement((checkChild as HTMLElement).tagName);
                    for (const attrib of (checkChild as HTMLElement).attributes) {
                        if (allowedAttributes.includes(attrib.name)) {
                            currElement.setAttribute(attrib.name, attrib.value);
                        }
                    }
                    copyElement.appendChild(currElement);
                }
                else {
                    currElement = copyElement;
                }
                copyContentWithFilteredTags((checkChild as HTMLElement), currElement, allowedTags, allowedAttributes);
            }
            else if (checkChild.nodeType == Node.TEXT_NODE) {
                if (checkChild.textContent) {
                    const currElement = document.createTextNode(checkChild.textContent);
                    copyElement.appendChild(currElement);
                }
            }
        });
    }
}
