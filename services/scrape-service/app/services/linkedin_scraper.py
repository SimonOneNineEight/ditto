from bs4 import BeautifulSoup, Tag
import requests
import time as tm
import logging

keyword = "Software%2BIntern%2B2025"
location = "95112"

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}


def get_with_retry(url, retries=5, delay=3):
    for _ in range(retries):
        try:
            r = requests.get(url, headers=headers, timeout=5)
            logging.info(f"r.status_code:{r.status_code}")
            if r.status_code != requests.codes.ok:
                tm.sleep(delay)
                continue
            return BeautifulSoup(r.content, "html.parser")
        except requests.exceptions.Timeout:
            logging.error(f"Timeout occurred for URL: {url}, retrying in {delay}sec...")
            tm.sleep(delay)
        except Exception as e:
            logging.error(
                f"An error occurred while retrieving the URL: {url}, error: {e}"
            )
    return None


def get_job_description(job_url):
    soup = get_with_retry(job_url)
    if not soup:
        return None

    div = soup.find("div", class_="description__text description__text--rich")

    if not isinstance(div, Tag):
        return None

    for element in div.find_all(["span", "a"]):
        element.decompose()

    for ul in div.find_all("ul"):
        for li in ul.find_all("li"):
            li.insert(0, "-")

    text = (
        div.get_text(separator="\n")
        .strip()
        .replace("\n\n", "")
        .replace("::maker", "")
        .replace("-\n", "- ")
        .replace("Show less", "")
        .replace("Show more", "")
    )

    return text


def transform(soup):
    job_list = []
    try:
        divs = soup.find_all("div", class_="base-search-card__info")
    except:
        logging.info("Empty page, no jobs found")
        return job_list

    for item in divs:
        title = item.find("h3").text.strip()
        company = item.find("a", class_="hidden-nested-link")
        location = item.find("span", class_="job-search-card__location")
        parent_div = item.parent
        entity_urn = parent_div["data-entity-urn"]
        job_posting_id = entity_urn.split(":")[-1]
        job_url = "https://www.linkedin.com/jobs/view/" + job_posting_id + "/"

        date_tag_new = item.find("time", class_="job-search-card__listdate--new")
        date_tag = item.find("time", class_="job-search-card__listdate")
        date = (
            date_tag["datetime"]
            if date_tag
            else date_tag_new["datetime"]
            if date_tag_new
            else ""
        )

        job = {
            "title": title,
            "company": company.text.strip().replace("\n", " ") if company else "",
            "location": location.text.strip() if location else "",
            "date": date,
            "job_url": job_url,
            "job_posting_id": job_posting_id,
        }

        job_list.append(job)

    return job_list


def scrape_jobs():
    try:
        all_jobs = []
        start = 0
        for i in range(1):
            start = i * 25

            search_url = f"https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords={keyword}&location=95112&geoId=104110784&trk=public_jobs_jobs-search-bar_search-submit&original_referer=https%3A%2F%2Fwww.linkedin.com%2Fjobs%2Fsearch%3Fkeywords%3D{keyword}&location%3DSan%2BJose%252C%2BCA%26geoId%3D104110784%26trk%3Dpublic_jobs_jobs-search-bar_search-submit&start={start}"

            soup = get_with_retry(search_url)
            job_list = transform(soup)
            all_jobs += job_list
        return all_jobs

    except Exception as e:
        logging.error(f"An error occurred while scraping, error: {e}")
    return []


def main():
    return None
    # jobs_soup = get_with_retry()
    # jobs = transform(jobs_soup)
    #
    # for job in jobs:
    #     print(job)
    #     print("--------")


# --------------------
if __name__ == "__main__":
    main()
