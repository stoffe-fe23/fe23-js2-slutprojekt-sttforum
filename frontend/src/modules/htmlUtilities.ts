

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
                        case "INPUT": (targetElement as HTMLInputElement).value = values[key] as string; break;
                        default: targetElement[allowHTML ? "innerHTML" : "innerText"] = values[key] as string; break;
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
                    attr.setAttribute(key, childAttributes[key]);
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