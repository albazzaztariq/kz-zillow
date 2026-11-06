# Almaty Sold-Price Explorer — static copy / Исследователь цен сделок в Алматы

**Live site: https://albazzaztariq.github.io/kz-zillow/**

A Zillow-style "what did it actually sell for" explorer for Almaty: median price per m² by quarter for the city, districts and streets, a map with one dot per building, address search (type an address, pick a match, see every recorded sale there), and a Russian / English switch (RU/EN button, top right; Russian is the default).

Алматы: медианная цена за м² по кварталам для города, районов и улиц, карта с точками-зданиями, поиск по адресу и переключатель RU / EN (кнопка справа вверху; по умолчанию русский).

## About this repository

This repository contains only the generated static site (plain HTML, JSON and JavaScript, no server). It is a snapshot; it is rebuilt from the open registry data and republished, it is not live data.

* **Data:** real-estate transactions of the ЕГКН (Unified State Real Estate Cadastre) via Smart Data Ukimet, portal [ashyq.data.gov.kz](https://ashyq.data.gov.kz), licence [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.
* **What is shown:** market sales (purchase/sale contracts) of apartments and houses, registered from 2000Q1; medians only; price outliers removed. Dates are registration dates.
* **Privacy:** notary names are not included and flat numbers are never published; the map and property pages show a building's address (street and house number) with the sales recorded there.
* **Limits:** only sales up to 2024Q2 can be placed on the map (about half of all residential sales): newer registry files carry no address. The latest quarter is only partly published. Locations come from OpenStreetMap and some are approximate.
