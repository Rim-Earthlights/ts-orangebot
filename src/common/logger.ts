import dayjs from 'dayjs';

export const clog = {
    info: function (gid: string, event: string, message?: string) {
        console.log(`[${dayjs().format('YYYY/MM/DD HH:mm:ss')}/INFO]: ${gid} | ${event}`);
        if (message) {
            console.log('> ' + message);
        }
    },
    error: function (gid: string, event: string, message?: string) {
        console.log(`[${dayjs().format('YYYY/MM/DD HH:mm:ss')}/ERROR]: ${gid} | ${event}`);
        if (message) {
            console.log('> ' + message);
        }
    }
};
