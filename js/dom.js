export function el(tag, attrs, ...children) {
    const node = document.createElement(tag);

    if (attrs) {
        for (const key in attrs) {
            const val = attrs[key];
            if (key === 'class' || key === 'className') {
                node.className = val || '';
            } else if (key === 'html') {
                node.innerHTML = val;
            } else if (key === 'style' && typeof val === 'object') {
                Object.assign(node.style, val);
            } else if (key.startsWith('data-')) {
                node.setAttribute(key, val);
            } else if (key.startsWith('on')) {
                const event = key.slice(2).toLowerCase();
                node.addEventListener(event, val);
            } else if (key === 'for') {
                node.setAttribute('for', val);
            } else if (key === 'type' || key === 'id' || key === 'name' || key === 'value' || key === 'href' || key === 'src' || key === 'alt' || key === 'title' || key === 'placeholder' || key === 'disabled' || key === 'checked' || key === 'selected' || key === 'tabindex' || key === 'role' || key === 'aria-label' || key === 'aria-expanded' || key === 'aria-controls' || key === 'aria-hidden' || key === 'aria-live' || key === 'rel' || key === 'target') {
                if (val !== false && val !== null && val !== undefined) {
                    node.setAttribute(key, val === true ? '' : val);
                }
            } else {
                node.setAttribute(key, val);
            }
        }
    }

    appendChildren(node, children);

    return node;
}

function appendChildren(node, children) {
    for (const child of children) {
        if (child == null || child === false) continue;
        if (Array.isArray(child)) {
            appendChildren(node, child);
        } else if (typeof child === 'string' || typeof child === 'number') {
            node.appendChild(document.createTextNode(child));
        } else {
            node.appendChild(child);
        }
    }
}

export function escape(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function delegate(parent, selector, event, handler) {
    parent.addEventListener(event, function (e) {
        var target = e.target.closest(selector);
        if (target && parent.contains(target)) {
            handler.call(target, e);
        }
    });
}
