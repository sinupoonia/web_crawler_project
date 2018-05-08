# -*- coding: utf-8 -*-
import scrapy
from scrapy.linkextractors import LinkExtractor
from scrapy.spiders import CrawlSpider, Rule
import urllib.parse as urlparse
from scrapy.selector import Selector
from scrapy.conf import settings


class IcrawlerSpider(CrawlSpider):
    name = 'icrawler'

    def __init__(self, *args, **kwargs):
        # We are going to pass these args from our django view.
        # To make everything dynamic, we need to override them
        # inside __init__ method
        self.url = kwargs.get('url')
        self.domain = kwargs.get('domain')
        self.start_urls = [self.url]
        self.allowed_domains = [self.domain]
        if kwargs.get('depth', None):
            settings.overrides['DEPTH_LIMIT'] = kwargs.get('depth')

        IcrawlerSpider.rules = [
           Rule(LinkExtractor(unique=True), callback='parse_item'),
        ]
        super(IcrawlerSpider, self).__init__(*args, **kwargs)

    def parse_item(self, response):
        content = Selector(response=response).xpath('//body')
        for nodes in content:
            # build absolute URLs
            img_urls = [urlparse.urljoin(response.url, src)
                        for src in nodes.xpath('//img/@src').extract()]

            item = {}
            item["page_link"] = response.url

            # use "image_urls" instead of "image_url"
            item['image_urls'] = img_urls

            yield item
