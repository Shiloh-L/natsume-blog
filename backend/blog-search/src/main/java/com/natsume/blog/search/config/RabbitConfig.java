package com.natsume.blog.search.config;

import com.natsume.blog.common.constant.MqConst;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.ExchangeBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {

    @Bean
    public TopicExchange postExchange() {
        return ExchangeBuilder.topicExchange(MqConst.POST_EXCHANGE).durable(true).build();
    }

    @Bean
    public Queue esSyncQueue() {
        return QueueBuilder.durable(MqConst.ES_SYNC_QUEUE).build();
    }

    @Bean
    public Binding esSyncBinding(Queue esSyncQueue, TopicExchange postExchange) {
        return BindingBuilder.bind(esSyncQueue).to(postExchange).with(MqConst.POST_PATTERN);
    }

    @Bean
    public MessageConverter jacksonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
