
/**
 * Use this file to define custom functions and blocks.
 * Read more at https://makecode.microbit.org/blocks/custom
 */

enum MyEnum {
    //% block="one"
    One,
    //% block="two"
    Two
}

enum WhichUniqueMotor {
    //% block="right motor"
    Right,
    //% block="left motor"
    Left
}
enum WhichMotor {
    //% block="both motors"
    Both,
    //% block="right motor"
    Right,
    //% block="left motor"
    Left

}

enum WhichDriveDirection {
    //% block="forward"
    Forward,
    //% block="backward"
    Backward
}

enum WhichTurnDirection {
    //% block="right"
    Right,
    //% block="left"
    Left
}

enum WhichUnitSystem {
    //% block="mm"
    mm,
    //% block="inches"
    inches
}

enum WhichSpeed {
    //% block="slowest"
    Slowest = 25,
    //% block="slower"
    Slower = 35,
    //% block="normal"
    Normal = 50,
    //% block="faster"
    Faster = 75,
    //% block="fastest"
    Fastest = 90
}

enum I2C_Commands {
    GET_FIRMWARE_VERSION = 1,
    GET_MANUFACTURER,
    GET_BOARD,
    GET_VOLTAGE_BATTERY,
    GET_LINE_SENSORS,
    GET_LIGHT_SENSORS,
    GET_MOTOR_STATUS_RIGHT,
    GET_MOTOR_STATUS_LEFT,
    SET_MOTOR_POWER,
    SET_MOTOR_POWERS
}
enum LineType {
    //% block="thin"
    Thin,
    //% block="thick"
    Thick
}

enum I2C_Sensors {
    I2C_DISTANCE_SENSOR = 0x2A
}

/**
 * Custom blocks
 */



//% weight=99 color=#0fbc11 icon="\uf0d1"
namespace gigglebot {
    /**
     */

    let PIMULT = 31416
    let PIDIV = 10000
    let WHEEL_BASE_WIDTH = 108
    let WHEEL_DIAMETER10 = 665
    let WHEEL_BASE_CIRCUMFERENCE = 339
    let WHEEL_CIRCUMFERENCE = WHEEL_DIAMETER10 * PIMULT / (10 * PIDIV)

    let MOTOR_GEAR_RATIO = 120
    let ENCODER_TICKS_PER_ROTATION = 6
    let MOTOR_TICKS_PER_DEGREE = (MOTOR_GEAR_RATIO * ENCODER_TICKS_PER_ROTATION) / 360

    let LINE_FOLLOWER_THRESHOLD = 100
    let MOTOR_LEFT = 0x01
    let MOTOR_RIGHT = 0x02
    let ADDR = 0x04

    let init_done = false;

    let left_motor_dps = WhichSpeed.Normal
    let right_motor_dps = WhichSpeed.Normal
    let left_dir = WhichDriveDirection.Forward
    let right_dir = WhichDriveDirection.Forward
    let line_sensor = [0, 0]
    let light_sensor = [0, 0]

    let default_motor_power = 50;
    let trim = 0
    let trimmed_motor = -1
    let motor_power_left = (default_motor_power + trim)
    let motor_power_right = (default_motor_power - trim)

    let strip = neopixel.create(DigitalPin.P8, 9, NeoPixelMode.RGB)


    function init() {
        if (init_done == false) {
        }
        init_done = true;
        // serial.writeLine("INIT")
    }

    function follow_thin_line() {
        let all_black = false
        gigglebot.drive_straight(WhichDriveDirection.Forward)
        while (!(all_black)) {
            line_sensor = gigglebot.get_raw_line_sensors()
            if (gigglebot.test_black_line()) {
                all_black = true
                strip.setPixelColor(0, neopixel.colors(NeoPixelColors.Black))
                strip.setPixelColor(1, neopixel.colors(NeoPixelColors.Black))
                gigglebot.stop()
            } else if (gigglebot.test_white_line()) {
                gigglebot.drive_straight(WhichDriveDirection.Forward)
            } else if (line_sensor[0] < LINE_FOLLOWER_THRESHOLD) {
                strip.setPixelColor(0, neopixel.colors(NeoPixelColors.Blue))
                gigglebot.stop()
                set_motor_power(WhichMotor.Left, motor_power_left + 5)
            } else if (line_sensor[1] < LINE_FOLLOWER_THRESHOLD) {
                strip.setPixelColor(1, neopixel.colors(NeoPixelColors.Blue))
                gigglebot.stop()
                set_motor_power(WhichMotor.Right, motor_power_right + 5)
            } else {
                strip.setPixelColor(0, neopixel.colors(NeoPixelColors.Green))
                strip.setPixelColor(1, neopixel.colors(NeoPixelColors.Green))
            }
            strip.show()
        }
    }

    function follow_thick_line() {
        let all_white = false
        gigglebot.drive_straight(WhichDriveDirection.Forward)
        while (!(all_white)) {
            line_sensor = gigglebot.get_raw_line_sensors()
            if (gigglebot.test_white_line()) {
                all_white = true
                strip.setPixelColor(0, neopixel.colors(NeoPixelColors.Black))
                strip.setPixelColor(1, neopixel.colors(NeoPixelColors.Black))
                gigglebot.stop()
            } else if (gigglebot.test_black_line()) {
                gigglebot.drive_straight(WhichDriveDirection.Forward)
            } else if (line_sensor[0] > LINE_FOLLOWER_THRESHOLD) {
                strip.setPixelColor(0, neopixel.colors(NeoPixelColors.Blue))
                gigglebot.stop()
                gigglebot.turn(WhichTurnDirection.Right)
            } else if (line_sensor[1] > LINE_FOLLOWER_THRESHOLD) {
                strip.setPixelColor(1, neopixel.colors(NeoPixelColors.Blue))
                gigglebot.stop()
                gigglebot.turn(WhichTurnDirection.Left)
            } else {
                strip.setPixelColor(0, neopixel.colors(NeoPixelColors.Green))
                strip.setPixelColor(1, neopixel.colors(NeoPixelColors.Green))
            }
            strip.show()
        }
    }

    ////////// BLOCKS

    /**
     * Will let gigglebot move forward or backward for a number of milliseconds. 
     * Distance covered during that time is related to the freshness of the batteries.
     */
    //% blockId="gigglebot_drive_x_millisec" block="drive %dir|for %delay|ms"
    export function drive_X_millisec(dir: WhichDriveDirection, delay: number) {
        let dir_factor = 1
        if (dir == WhichDriveDirection.Backward) {
            dir_factor = -1
        }
        if (dir == WhichDriveDirection.Forward) {
            dir_factor = 1
        }
        set_motor_powers(motor_power_left * dir_factor, motor_power_right * dir_factor)
        basic.pause(delay)
        set_motor_power(WhichMotor.Both, 0)
    }

    /**
     * Will make GiggleBot turn left and right for a number of milliseconds. How far it turns depends on the freshness of the batteries.
     */
    //% blockId="gigglebot_turn_X_millisec" block="turn %turn_dir|for %delay|ms"
    export function turn_X_millisec(turn_dir: WhichTurnDirection, delay: number) {
        if (turn_dir == WhichTurnDirection.Left) {
            set_motor_powers(0, motor_power_right)
        }
        else {
            set_motor_powers(motor_power_left, 0)
        }
        basic.pause(delay)
        set_motor_power(WhichMotor.Both, 0)
    }

    /**
     * Will let gigglebot move forward or backward until told otherwise (either by a stop block or a turn block).
     */
    //% blockId="gigglebot_drive_straight" block="drive %dir"
    export function drive_straight(dir: WhichDriveDirection) {
        let dir_factor = 1
        if (dir == WhichDriveDirection.Backward) {
            dir_factor = -1
        }
        if (dir == WhichDriveDirection.Forward) {
            dir_factor = 1
        }
        set_motor_powers(motor_power_left * dir_factor, motor_power_right * dir_factor)
    }

    /**
     * Will make GiggleBot turn left or right until told otherwise (by a stop block or a drive block).
     */
    //% blockId="gigglebot_turn" block="turn %turn_dir"
    export function turn(turn_dir: WhichTurnDirection) {
        if (turn_dir == WhichTurnDirection.Left) {
            set_motor_powers(0, motor_power_right)
        }
        else {
            set_motor_powers(motor_power_left, 0)
        }
    }

    /**
    * stops the robot.
    */
    //% blockId="gigglebot_stop" block="stop"
    export function stop() {
        init()
        set_motor_power(WhichMotor.Both, 0)
    }

    /** 
     * You can set the speed for each individual motor or both together. The higher the speed the less control the robot has. 
     * You may need to correct the robot (see block in "more..." section).  A faster robot needs more correction than a slower one.
     * If you want to follow a line,  it will work best at a lower speed.
     * Actual speed is dependent on the freshness of the batteries.
     */
    //% blockId="gigglebot_set_speed" block="set %motor | speed to %speed"
    export function set_speed(motor: WhichMotor, speed: WhichSpeed) {
        if (motor != WhichMotor.Left) {
            if (trimmed_motor == WhichUniqueMotor.Right) {
                motor_power_right = speed - trim;
            }
            else {
                motor_power_right = speed;
            }
        }
        if (motor != WhichMotor.Right) {
            if (trimmed_motor == WhichUniqueMotor.Left) {
                motor_power_left = speed - trim;
            }
            else {
                motor_power_left = speed;
            }
        }

    }

    /////////// LINE FOLLOWER BLOCKS
    /**
     * A thin black line would fall between the two sensors. The GiggleBot will stop when both sensors are reading black.
     * A thick black line would have the two sensors on top of it at all times. The GiggleBot will stop when both sensors are reading white.
    */
    //% blockId="gigglebot_follow_line" block="follow a %type_of_line| black line"
    //% subcategory=OnBoardSensors
    export function follow_line(type_of_line: LineType) {
        strip.setBrightness(10)

        if (type_of_line == LineType.Thin) {
            follow_thin_line()
        }
        else {
            follow_thick_line()
        }
    }

    /**
     * Will return true if the whole line sensor is reading black, like when it's over a black square
    */
    //% blockId="gigglebot_test_black_line" block="black line is detected"
    //% subcategory=OnBoardSensors
    export function test_black_line(): boolean {
        get_raw_line_sensors()
        for (let _i = 0; _i < line_sensor.length; _i++) {
            if (line_sensor[_i] > LINE_FOLLOWER_THRESHOLD) {
                return false
            }
        }
        return true
    }

    /**
     * Will return true if the whole line sensor is reading white, like when it's over a blank page
    */
    //% blockId="gigglebot_test_white_line" block="white line is detected"
    //% subcategory=OnBoardSensors
    export function test_white_line(): boolean {
        get_raw_line_sensors()
        for (let _i = 0; _i < line_sensor.length; _i++) {
            if (line_sensor[_i] < LINE_FOLLOWER_THRESHOLD) {
                return false
            }
        }
        return true
    }

    /**
    * Reads left or right line sensor
    */
    //% blockId="gigglebot_read_line_sensors" block="%which|line sensor"
    //% subcategory=OnBoardSensors
    export function get_line_sensor(which: WhichTurnDirection): number {
        get_raw_line_sensors()
        return line_sensor[which]
    }

    /**
     * Will follow a spotlight shone on its eyes. If the spotlight disappears the GiggleBot will stop.
     */
    //% blockId="gigglebot_follow_light" block="follow light"
    //% subcategory=OnBoardSensors
    export function follow_light() {
        // take ambient reading
        let ambient_lights = get_raw_light_sensors();
        let current_lights = ambient_lights;
        let diff = 0
        while ((current_lights[0] > ambient_lights[0]) || (current_lights[1] > ambient_lights[1])) {
            current_lights = get_raw_light_sensors()
            diff = (current_lights[0] - current_lights[1]) / 10;
            serial.writeLine("" + current_lights[0] + ". " + current_lights[0] + " diff:" + diff)
            if (current_lights[0] > current_lights[1]) {
                // it's brighter to the right
                set_motor_powers(motor_power_left, motor_power_right - diff)
                serial.writeLine("Turn Right")
            }
            else {
                // it's brighter to the left
                serial.writeLine("Turn Left")
                set_motor_powers(motor_power_left + diff, motor_power_right)
            }
        }
        set_motor_power(WhichMotor.Both, 0)
    }

    /**
    * Reads left or right light sensor
    */
    //% blockId="gigglebot_read_light_sensors" block="%which|light sensor"
    //% subcategory=OnBoardSensors
    export function get_light_sensor(which: WhichTurnDirection): number {
        get_raw_light_sensors()
        return light_sensor[which]
    }


    /////////// MORE BLOCKS

    //% blockId="gigglebot_trim" block="correct towards %dir|by %trim_value|%"
    //% advanced=true
    export function set_motor_trim(dir: WhichTurnDirection, trim_value: number) {
        init()
        trim = trim_value
        if (dir == WhichTurnDirection.Left) {
            trimmed_motor = WhichUniqueMotor.Left
            motor_power_left = default_motor_power - trim_value
        } if (dir == WhichTurnDirection.Right) {
            trimmed_motor = WhichUniqueMotor.Right
            motor_power_right = default_motor_power - trim_value
        }

    }

    //% blockId="gigglebot_set_motor" block="set power on %motor| to | %power"
    //% advanced=true
    export function set_motor_power(motor: WhichMotor, power: number) {
        init()
        let buf = pins.createBuffer(3)
        buf.setNumber(NumberFormat.UInt8BE, 0, I2C_Commands.SET_MOTOR_POWER)
        buf.setNumber(NumberFormat.UInt8BE, 2, power)
        // activate right motor
        if (motor == WhichMotor.Right) {
            buf.setNumber(NumberFormat.UInt8BE, 1, 0x01)
        }
        // activate left motor
        else if (motor == WhichMotor.Left) {
            buf.setNumber(NumberFormat.UInt8BE, 1, 0x02)
        }
        // activate both motors
        else if (motor == WhichMotor.Both) {
            buf.setNumber(NumberFormat.UInt8BE, 1, 0x03)
        }
        pins.i2cWriteBuffer(ADDR, buf, false);
    }

    //% blockId="gigglebot_set_motors" block="set left power to %left_power|and right to | %right_power"
    //% advanced=true
    export function set_motor_powers(left_power: number, right_power: number) {
        init()
        let buf = pins.createBuffer(3)
        buf.setNumber(NumberFormat.UInt8BE, 0, I2C_Commands.SET_MOTOR_POWERS)
        buf.setNumber(NumberFormat.UInt8BE, 1, right_power)
        buf.setNumber(NumberFormat.UInt8BE, 2, left_power)
        pins.i2cWriteBuffer(ADDR, buf, false);
    }

    /**
     * Displays the current battery voltage. Anything lower than 3.4 is too low to run the motors
     */
    //% blockId="gigglebot_show_voltage" block="show battery voltage (mv)"
    //% advanced=true
    export function show_voltage() {
        let voltage = get_voltage()
        basic.showNumber(voltage)
    }

    //% blockId="gigglebot_get_firmware" block="firmware version number"
    //% advanced=true
    export function get_firmware(): number {
        /**
         * TODO: describe your function here
         * @param value describe value here, eg: 5
         */
        init()
        let buf = pins.createBuffer(1)
        buf.setNumber(NumberFormat.UInt8BE, 0, I2C_Commands.GET_FIRMWARE_VERSION)
        pins.i2cWriteBuffer(ADDR, buf)
        let val = pins.i2cReadBuffer(ADDR, 2)
        return val.getNumber(NumberFormat.UInt16BE, 0);
    }

    //% blockId="gigglebot_get_voltage" block="battery voltage (mv)"
    //% advanced=true
    export function get_voltage(): number {
        /**
         * TODO: describe your function here
         * @param value describe value here, eg: 5
         */
        init()
        let buf = pins.createBuffer(1)
        buf.setNumber(NumberFormat.UInt8BE, 0, I2C_Commands.GET_VOLTAGE_BATTERY)
        pins.i2cWriteBuffer(ADDR, buf)
        let val = pins.i2cReadBuffer(ADDR, 2)
        return val.getNumber(NumberFormat.UInt16BE, 0);
    }


    /**
    * Reads the two line sensors
    */
    //% blockId="gigglebot_read_raw_line_sensors" block="raw line sensors (x2)"
    //% advanced=true
    export function get_raw_line_sensors(): number[] {
        let buf = pins.createBuffer(1)
        buf.setNumber(NumberFormat.UInt8BE, 0, I2C_Commands.GET_LINE_SENSORS)
        pins.i2cWriteBuffer(ADDR, buf)
        let raw_buffer = pins.i2cReadBuffer(ADDR, 3)
        for (let _i = 0; _i < 2; _i++) {
            line_sensor[_i] = (raw_buffer.getNumber(NumberFormat.UInt8BE, _i) << 2)
            line_sensor[_i] |= (((raw_buffer.getNumber(NumberFormat.UInt8BE, 2) << (_i * 2)) & 0xC0) >> 6)
            line_sensor[_i] = 1023 - line_sensor[_i]
        }
        return line_sensor
    }


    //% blockId="gigglebot_read_raw_light_sensors" block="raw light sensors (x2)"
    //% advanced=true
    export function get_raw_light_sensors(): number[] {
        let buf = pins.createBuffer(1)
        buf.setNumber(NumberFormat.UInt8BE, 0, I2C_Commands.GET_LIGHT_SENSORS)
        pins.i2cWriteBuffer(ADDR, buf)
        let raw_buffer = pins.i2cReadBuffer(ADDR, 3)
        for (let _i = 0; _i < 2; _i++) {
            light_sensor[_i] = (raw_buffer.getNumber(NumberFormat.UInt8BE, _i) << 2)
            light_sensor[_i] |= (((raw_buffer.getNumber(NumberFormat.UInt8BE, 2) << (_i * 2)) & 0xC0) >> 6)
            light_sensor[_i] = 1023 - light_sensor[_i]
        }
        serial.writeNumbers(light_sensor)
        return light_sensor
    }
}
