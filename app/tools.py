from typing import Literal

import requests
import ujson

from app.config import get_settings
from app.security import create_qweather_jwt

settings = get_settings()


def get_city_code_by_name(city_name: str) -> str | None:
    """
    根据城市名称获取城市编号

    该函数通过读取预定义的城市代码映射文件(city_code.json)来查找城市对应的编号。
    如果找不到对应的城市，则返回 None。

    Args:
        city_name (str): 城市名称，例如："北京"、"上海"等

    Returns:
        str | None: 城市编号字符串，如果未找到对应城市则返回 None
    """
    DATA_FILE_PATH = settings.DATA_DIR / "city_code.json"
    with open(DATA_FILE_PATH, encoding="utf-8") as f:
        city_code_mapping: dict = ujson.load(f)
    city_code = city_code_mapping.get(city_name)
    return city_code


def get_weather_now(city_code: str) -> dict:
    """
    根据城市编码获取实时天气数据

    该函数通过调用和风天气API获取指定城市的当前天气信息，
    包括温度、湿度、风力等详细数据。

    Args:
        city_code (str): 城市编码，可通过 get_city_code_by_name 函数获取

    Returns:
        dict: 包含天气数据的字典，格式如下：
            - code (str): 状态码，"200"表示成功，"500"表示失败
            - message (str): 状态消息
            - data (dict, optional): 天气详情数据（仅在成功时存在），包含：
                - 数据观测时间: obsTime
                - 温度: temp
                - 体感温度: feelsLike
                - 天气: text
                - 风向: windDir
                - 风速(km/h): windSpeed
                - 风力等级: windScale
                - 相对湿度(%): humidity
                - 过去1小时降水量(mm): precip
                - 大气压强(hPa): pressure
                - 能见度(km): vis
                - 云量(%): cloud
                - 露点温度(℃): dew
    """
    API_URL = f"{settings.QWEATHER_API_BASE}/weather/now"
    jwt = create_qweather_jwt()
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {jwt}",
    }
    params = {"location": city_code}
    resp_data: dict = requests.get(API_URL, headers=headers, params=params).json()
    if resp_data.get("code") != "200":
        data = {"code": "500", "message": "获取天气数据失败"}
    else:
        resp_weather_data: dict = resp_data.get("now", {})
        data = {
            "code": "200",
            "message": "获取天气数据成功",
            "data": {
                "数据观测时间": resp_weather_data.get("obsTime"),
                "温度": resp_weather_data.get("temp"),
                "体感温度": resp_weather_data.get("feelsLike"),
                "天气": resp_weather_data.get("text"),
                "风向": resp_weather_data.get("windDir"),
                "风速(km/h)": resp_weather_data.get("windSpeed"),
                "风力等级": resp_weather_data.get("windScale"),
                "相对湿度(%)": resp_weather_data.get("humidity"),
                "过去1小时降水量(mm)": resp_weather_data.get("precip"),
                "大气压强(hPa)": resp_weather_data.get("pressure"),
                "能见度(km)": resp_weather_data.get("vis"),
                "云量(%)": resp_weather_data.get("cloud"),
                "露点温度(℃)": resp_weather_data.get("dew"),
            },
        }
    return data


def get_weather_days(city_code: str, days: Literal["3", "7", "10", "15", "30"] = "3") -> dict:
    """
    根据城市编码获取每日天气预报

    该函数通过调用和风天气API获取指定城市未来几天的天气预报信息，
    包括温度、天气状况、风力等详细数据。

    Args:
        city_code (str): 城市编码，可通过 get_city_code_by_name 函数获取
        days (Literal["3", "7", "10", "15", "30"] = "3"): 预报天数，可选值为3、7、10、15、30，默认为3

    Returns:
        dict: 包含天气预报数据的字典，格式如下：
            - code (str): 状态码，"200"表示成功，"500"表示失败
            - message (str): 状态消息
            - data (list, optional): 天气预报数据列表（仅在成功时存在），每个元素包含：
                - 预报日期: fxDate
                - 日出时间: sunrise
                - 日落时间: sunset
                - 月升时间: moonrise
                - 月落时间: moonset
                - 月相名称: moonPhase
                - 预报当天最高温度: tempMax
                - 预报当天最低温度: tempMin
                - 预报白天天气: textDay
                - 预报晚间天气: textNight
                - 预报白天风向: windDirDay
                - 预报白天风力等级: windScaleDay
                - 预报白天风速(km/h): windSpeedDay
                - 预报夜间风向: windDirNight
                - 预报夜间风力等级: windScaleNight
                - 预报夜间风速(km/h): windSpeedNight
                - 预报当天总降水量(mm): precip
                - 紫外线强度指数: uvIndex
                - 相对湿度(%): humidity
                - 大气压强(hPa): pressure
                - 能见度(km): vis
                - 云量(%): cloud
    """
    days = f"{str(days)}d"
    API_URL = f"{settings.QWEATHER_API_BASE}/weather/{days}"
    jwt = create_qweather_jwt()
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {jwt}",
    }
    params = {"location": city_code}
    resp_data: dict = requests.get(API_URL, headers=headers, params=params).json()

    if resp_data.get("code") != "200":
        data = {"code": "500", "message": "获取天气数据失败"}
    else:
        resp_weather_data: dict = resp_data.get("daily", [])
        data = {
            "code": "200",
            "message": "获取天气数据成功",
            "data": [
                {
                    "预报日期": dayli_data.get("fxDate"),
                    "日出时间": dayli_data.get("sunrise"),
                    "日落时间": dayli_data.get("sunset"),
                    "月升时间": dayli_data.get("moonrise"),
                    "月落时间": dayli_data.get("moonset"),
                    "月相名称": dayli_data.get("moonPhase"),
                    "预报当天最高温度": dayli_data.get("tempMax"),
                    "预报当天最低温度": dayli_data.get("tempMin"),
                    "预报白天天气": dayli_data.get("textDay"),
                    "预报晚间天气": dayli_data.get("textNight"),
                    "预报白天风向": dayli_data.get("windDirDay"),
                    "预报白天风力等级": dayli_data.get("windScaleDay"),
                    "预报白天风速(km/h)": dayli_data.get("windSpeedDay"),
                    "预报夜间风向": dayli_data.get("windDirNight"),
                    "预报夜间风力等级": dayli_data.get("windScaleNight"),
                    "预报夜间风速(km/h)": dayli_data.get("windSpeedNight"),
                    "预报当天总降水量(mm)": dayli_data.get("precip"),
                    "紫外线强度指数": dayli_data.get("uvIndex"),
                    "相对湿度(%)": dayli_data.get("humidity"),
                    "大气压强(hPa)": dayli_data.get("pressure"),
                    "能见度(km)": dayli_data.get("vis"),
                    "云量(%)": dayli_data.get("cloud"),
                }
                for dayli_data in resp_weather_data
            ],
        }
    return data


if __name__ == "__main__":
    city_name = "上海"
    city_code = get_city_code_by_name(city_name)
    print(city_code)
    city_name = "未知"
    city_code = get_city_code_by_name(city_name)
    print(city_code)
    city_name = "成都"
    city_code = get_city_code_by_name(city_name)
    weather_data = get_weather_now(city_code)
    print(weather_data)
    weather_data = get_weather_days(city_code)
    print(weather_data)
