package com.simon198.oddish.services;

import com.simon198.oddish.model.JobDescription;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

@Service
public class ExternalApiService {
	private final WebClient.Builder webClientBuilder;
	private final String timburrApiBaseUrl;

	@Autowired
	public ExternalApiService(WebClient.Builder webClientBuilder, @Value("${external.timburr.base.url}") String timburrApiBaseUrl) {
		this.webClientBuilder = webClientBuilder;
		this.timburrApiBaseUrl = timburrApiBaseUrl;
	}

	public JobDescription scrapeJobDescription(Long jobId) {
		WebClient webClient = webClientBuilder.baseUrl(timburrApiBaseUrl).build();

		Mono<JobDescription> response = webClient.get() .uri("/job_description/" + jobId)
				.retrieve()
				.onStatus(
						status -> status.is4xxClientError() || status.is5xxServerError(),
						clientResponse -> Mono.error(
								new WebClientResponseException(
										"Error: Received " + clientResponse.statusCode().value(),
										clientResponse.statusCode().value(),
										HttpStatus.resolve(clientResponse.statusCode().value()) != null
												? HttpStatus.resolve(clientResponse.statusCode().value()).getReasonPhrase()
												: "Unknown Status",  // If not in HttpStatus, return "Unknown Status"
										clientResponse.headers().asHttpHeaders(), null, null))
				)
				.bodyToMono(JobDescription.class);

		return response.block();
	}

}
