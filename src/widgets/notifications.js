import Notifications from '../service/notifications.js';
import { lookUpIcon, restcheck, timeout, typecheck } from '../utils.js';
import Widget from '../widget.js';
import { Box, Button, Dynamic, Icon } from './basic.js';

const _icon = ({ appEntry, appIcon, image }) => {
    if (image) {
        return {
            type: 'box',
            style: `
                background-image: url("${image}");
                background-size: contain;
                min-width: 78px;
                min-height: 78px;
            `,
        };
    }

    let icon = 'dialog-information-symbolic';
    if (lookUpIcon(appIcon))
        icon = appIcon;

    if (lookUpIcon(appEntry))
        icon = appEntry;

    return {
        type: 'box',
        style: `
            min-width: 78px;
            min-height: 78px;
        `,
        children: [{
            type: 'icon', icon, size: 58,
            halign: 'center', hexpand: true,
            valign: 'center', vexpand: true,
        }],
    };
};

const _notification = ({ id, summary, body, actions, urgency, time, ...icon }) => Widget({
    type: 'eventbox',
    className: `notification ${urgency}`,
    onClick: () => Notifications.dismiss(id),
    child: Box({
        orientation: 'vertical',
        children: [
            Widget({
                type: 'box',
                children: [
                    Widget({
                        className: 'icon',
                        valign: 'start',
                        ..._icon(icon),
                    }),
                    Box({
                        orientation: 'vertical',
                        children: [
                            Box({
                                children: [
                                    Widget({
                                        className: 'title',
                                        hexpand: true,
                                        xalign: 0,
                                        type: 'label',
                                        label: summary,
                                        wrap: true,
                                    }),
                                    Widget({
                                        className: 'time',
                                        valign: 'start',
                                        type: 'label',
                                        label: time.format('%H:%M'),
                                    }),
                                    Widget({
                                        className: 'close-button',
                                        valign: 'start',
                                        type: 'button',
                                        child: Icon({ icon: 'window-close-symbolic' }),
                                        onClick: () => Notifications.close(id),
                                    }),
                                ],
                            }),
                            Widget({
                                className: 'description',
                                hexpand: true,
                                markup: true,
                                xalign: 0,
                                justify: 'left',
                                type: 'label',
                                label: body,
                                wrap: true,
                            }),
                        ],
                    }),
                ],
            }),
            Widget({
                type: 'box',
                className: 'actions',
                connections: [['draw', widget => { widget.visible = actions.length > 0; }]],
                children: actions.map(({ action, label }) => ({
                    className: 'action-button',
                    type: 'button',
                    onClick: () => Notifications.invoke(id, action),
                    hexpand: true,
                    child: label,
                })),
            }),
        ],
    }),
});

const _list = (map, { type, notification, ...rest }) => {
    notification ||= _notification;
    typecheck('notification', notification, 'function', type);
    restcheck(rest, type);

    const box = Box({ orientation: 'vertical' });
    Notifications.connect(box, () => {
        box.get_children().forEach(ch => ch.destroy());
        for (const [, n] of Notifications[map])
            box.add(notification(n));

        box.show_all();
    });

    return box;
};

export function NotificationList(props) {
    return _list('notifications', props);
}

export function NotificationPopups(props) {
    return _list('popups', props);
}

export function Placeholder(props) {
    const box = Box(props);
    const update = () => {
        box.visible = Notifications.notifications.size === 0;
    };
    Notifications.connect(box, update);
    box.connect('draw', update);
    return box;
}

export function ClearButton(props) {
    const button = Button({
        onClick: () => Notifications.clear(),
        ...props,
    });
    return button;
}

export function DNDIndicator({
    silent = Icon({ icon: 'notifications-disabled-symbolic' }),
    noisy = Icon({ icon: 'preferences-system-notifications-symbolic' }),
    ...rest
}) {
    const dynamic = Dynamic({
        ...rest,
        items: [
            { value: true, widget: silent },
            { value: false, widget: noisy },
        ],
    });

    const update = () => dynamic.update(value => value === Notifications.dnd);
    Notifications.connect(dynamic, update);
    timeout(100, update);

    return dynamic;
}

export function DNDToggle(props) {
    const button = Button({
        ...props,
        onClick: () => { Notifications.dnd = !Notifications.dnd; },
    });
    Notifications.connect(button, () => button.toggleClassName(Notifications.dnd, 'on'));
    return button;
}
